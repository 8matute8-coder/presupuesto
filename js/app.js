/**
 * app.js - Orquestador principal de la aplicación, inicialización y eventos
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar Almacenamiento
  StorageManager.initStorage();

  // 2. Inicializar Tema (Claro / Oscuro)
  initTheme();

  // 3. Inicializar Selector de Mes
  initMonthSelector();

  // 4. Inicializar Navegación por Pestañas
  initTabs();

  // 5. Inicializar Modales y Formularios
  initModalsAndForms();

  // 6. Inicializar Calculadoras Interactivas
  initInteractiveCalculators();

  // 7. Inicializar Eventos de Configuración y Respaldo
  initSettingsAndBackup();

  // 8. Renderizar Vista Inicial
  UIManager.switchTab('dashboard');

  if (window.lucide) lucide.createIcons();
});

function initTheme() {
  const currentTheme = StorageManager.getTheme();
  if (currentTheme === 'dark' || (!currentTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      StorageManager.setTheme(isDark ? 'dark' : 'light');
      ChartsManager.refreshAllCharts();
      UIManager.refreshCurrentView();
      if (window.lucide) lucide.createIcons();
    });
  }
}

function initMonthSelector() {
  const monthInput = document.getElementById('global-month-picker');
  if (monthInput) {
    const today = new Date();
    const currentMonthStr = today.toISOString().slice(0, 7);
    monthInput.value = currentMonthStr;
    UIManager.selectedMonth = currentMonthStr;

    monthInput.addEventListener('change', (e) => {
      UIManager.selectedMonth = e.target.value;
      UIManager.refreshCurrentView();
    });
  }
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      if (tabName) {
        UIManager.switchTab(tabName);
      }
    });
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const input = modal.querySelector('input, select');
    if (input) input.focus();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function initModalsAndForms() {
  // Botones de Abrir Modales
  document.getElementById('btn-open-tx-modal')?.addEventListener('click', () => {
    const dateInput = document.getElementById('tx-date');
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
    openModal('modal-add-transaction');
  });

  document.getElementById('btn-open-bill-modal')?.addEventListener('click', () => {
    openModal('modal-add-bill');
  });

  document.getElementById('btn-open-debt-modal')?.addEventListener('click', () => {
    openModal('modal-add-debt');
  });

  document.getElementById('btn-open-goal-modal')?.addEventListener('click', () => {
    openModal('modal-add-goal');
  });

  // Botones de Cerrar Modales
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) modal.classList.add('hidden');
    });
  });

  // Cerrar al presionar Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    }
  });

  // Auto-clasificación 50/30/20 sugerida al seleccionar categoría
  const categorySelect = document.getElementById('tx-category');
  const classSelect = document.getElementById('tx-classification');
  const typeSelect = document.getElementById('tx-type');

  const defaultCategoryClassification = {
    'Vivienda / Alquiler': 'need',
    'Servicios (Luz, Gas, Internet)': 'need',
    'Supermercado & Alimentación': 'need',
    'Transporte & Combustible': 'need',
    'Salud & Farmacia': 'need',
    'Educación': 'need',
    'Salidas & Restaurantes': 'want',
    'Streaming & Suscripciones': 'want',
    'Compras & Caprichos': 'want',
    'Viajes & Vacaciones': 'want',
    'Ahorro / Fondo Emergencia': 'savings',
    'Pago de Deudas': 'savings',
    'Inversiones': 'savings',
    'Salario / Sueldo': 'income',
    'Otros Ingresos': 'income'
  };

  if (categorySelect && classSelect) {
    categorySelect.addEventListener('change', () => {
      const cat = categorySelect.value;
      const suggested = defaultCategoryClassification[cat];
      if (suggested) {
        if (suggested === 'income') {
          if (typeSelect) typeSelect.value = 'income';
          classSelect.value = 'income';
        } else {
          if (typeSelect) typeSelect.value = 'expense';
          classSelect.value = suggested;
        }
      }
    });
  }

  // Submit: Formulario Movimiento
  document.getElementById('form-add-transaction')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('tx-type').value;
    const amount = Number(document.getElementById('tx-amount').value);
    const category = document.getElementById('tx-category').value;
    const classification = document.getElementById('tx-classification').value;
    const date = document.getElementById('tx-date').value || new Date().toISOString().slice(0, 10);
    const paymentMethod = document.getElementById('tx-payment-method').value;
    const notes = document.getElementById('tx-notes').value;

    if (!amount || amount <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }

    const newTx = {
      id: 'tx-' + Date.now(),
      date,
      type,
      amount,
      category,
      classification: type === 'income' ? 'income' : classification,
      paymentMethod,
      notes
    };

    const transactions = StorageManager.getTransactions();
    transactions.push(newTx);
    StorageManager.saveTransactions(transactions);

    closeModal('modal-add-transaction');
    document.getElementById('form-add-transaction').reset();
    UIManager.refreshCurrentView();
    UIManager.showToast('¡Movimiento guardado con éxito!');
  });

  // Submit: Formulario Factura
  document.getElementById('form-add-bill')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('bill-name').value;
    const amount = Number(document.getElementById('bill-amount').value);
    const dueDay = Number(document.getElementById('bill-dueday').value);
    const category = document.getElementById('bill-category').value;
    const isPaid = document.getElementById('bill-ispaid').checked;

    if (!name || !amount || !dueDay) {
      alert('Completa los campos obligatorios.');
      return;
    }

    const newBill = {
      id: 'bill-' + Date.now(),
      name,
      amount,
      dueDay,
      category,
      isPaid
    };

    const bills = StorageManager.getBills();
    bills.push(newBill);
    StorageManager.saveBills(bills);

    closeModal('modal-add-bill');
    document.getElementById('form-add-bill').reset();
    UIManager.refreshCurrentView();
    UIManager.showToast('Factura recurrente registrada.');
  });

  // Submit: Formulario Deuda
  document.getElementById('form-add-debt')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('debt-name').value;
    const totalAmount = Number(document.getElementById('debt-total').value);
    const remainingAmount = Number(document.getElementById('debt-remaining').value) || totalAmount;
    const interestRate = Number(document.getElementById('debt-interest').value) || 0;
    const minimumPayment = Number(document.getElementById('debt-minpayment').value) || 0;

    if (!name || !totalAmount) {
      alert('Completa el nombre y monto de la deuda.');
      return;
    }

    const newDebt = {
      id: 'debt-' + Date.now(),
      name,
      totalAmount,
      remainingAmount,
      interestRate,
      minimumPayment
    };

    const debts = StorageManager.getDebts();
    debts.push(newDebt);
    StorageManager.saveDebts(debts);

    closeModal('modal-add-debt');
    document.getElementById('form-add-debt').reset();
    UIManager.refreshCurrentView();
    UIManager.showToast('Deuda agregada al plan de pagos.');
  });

  // Submit: Formulario Meta de Ahorro
  document.getElementById('form-add-goal')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('goal-name').value;
    const targetAmount = Number(document.getElementById('goal-target').value);
    const currentAmount = Number(document.getElementById('goal-current').value) || 0;
    const deadline = document.getElementById('goal-deadline').value;
    const icon = document.getElementById('goal-icon').value || 'target';

    if (!name || !targetAmount) {
      alert('Completa el nombre y el monto meta.');
      return;
    }

    const newGoal = {
      id: 'goal-' + Date.now(),
      name,
      targetAmount,
      currentAmount,
      deadline,
      icon
    };

    const goals = StorageManager.getGoals();
    goals.push(newGoal);
    StorageManager.saveGoals(goals);

    closeModal('modal-add-goal');
    document.getElementById('form-add-goal').reset();
    UIManager.refreshCurrentView();
    UIManager.showToast('Nueva meta de ahorro creada.');
  });

  // Filtros de búsqueda en tabla de movimientos
  document.getElementById('tx-search-input')?.addEventListener('input', () => UIManager.renderTransactions());
  document.getElementById('tx-filter-category')?.addEventListener('change', () => UIManager.renderTransactions());
  document.getElementById('tx-filter-class')?.addEventListener('change', () => UIManager.renderTransactions());
}

function initInteractiveCalculators() {
  // Simulador Regla 50/30/20
  const calcBaseIncome = document.getElementById('calc-base-income');
  if (calcBaseIncome) {
    calcBaseIncome.addEventListener('input', () => {
      const config = StorageManager.getConfig();
      const income = Number(calcBaseIncome.value) || 0;
      const targetNeeds = income * 0.50;
      const targetWants = income * 0.30;
      const targetSavings = income * 0.20;

      document.getElementById('calc-target-needs').textContent = UIManager.formatCurrency(targetNeeds, config.currencySymbol);
      document.getElementById('calc-target-wants').textContent = UIManager.formatCurrency(targetWants, config.currencySymbol);
      document.getElementById('calc-target-savings').textContent = UIManager.formatCurrency(targetSavings, config.currencySymbol);
    });
  }

  // Calculadora Ahorro Automático "Págate a ti primero"
  const autoSaveIncome = document.getElementById('auto-save-income');
  const autoSavePct = document.getElementById('auto-save-pct');
  const autoSaveResult = document.getElementById('auto-save-result');

  const updateAutoSave = () => {
    const config = StorageManager.getConfig();
    const income = Number(autoSaveIncome?.value) || 0;
    const pct = Number(autoSavePct?.value) || 20;
    if (autoSaveResult) {
      autoSaveResult.textContent = UIManager.formatCurrency(income * (pct / 100), config.currencySymbol);
    }
  };

  autoSaveIncome?.addEventListener('input', updateAutoSave);
  autoSavePct?.addEventListener('change', updateAutoSave);
}

function initSettingsAndBackup() {
  // Guardar Configuración
  document.getElementById('form-settings')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const currency = document.getElementById('setting-currency').value;
    const expectedIncome = Number(document.getElementById('setting-expected-income').value) || 0;
    const debtStrategy = document.getElementById('setting-debt-strategy').value;

    const symbols = { ARS: '$', USD: 'US$', EUR: '€', MXN: '$', COP: '$', CLP: '$' };

    StorageManager.saveConfig({
      currency,
      currencySymbol: symbols[currency] || '$',
      monthlyExpectedIncome: expectedIncome,
      debtStrategy
    });

    UIManager.refreshCurrentView();
    UIManager.showToast('Configuración guardada correctamente.');
  });

  // Exportar CSV
  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    const success = StorageManager.exportCSV(UIManager.selectedMonth);
    if (success) {
      UIManager.showToast('Reporte CSV descargado.');
    } else {
      alert('No hay movimientos en este mes para exportar.');
    }
  });

  // Exportar JSON
  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    StorageManager.exportJSON();
    UIManager.showToast('Copia de respaldo JSON generada.');
  });

  // Importar JSON
  document.getElementById('btn-import-json')?.addEventListener('click', () => {
    document.getElementById('file-input-backup')?.click();
  });

  document.getElementById('file-input-backup')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const ok = StorageManager.importJSON(event.target.result);
      if (ok) {
        UIManager.refreshCurrentView();
        UIManager.showToast('¡Datos importados con éxito!');
      } else {
        alert('El archivo de respaldo no tiene un formato válido.');
      }
    };
    reader.readAsText(file);
  });

  // Restaurar datos de ejemplo
  document.getElementById('btn-reset-sample')?.addEventListener('click', () => {
    if (confirm('¿Restablecer datos a los valores de ejemplo? (Se sobrescribirán los datos actuales)')) {
      StorageManager.resetToSampleData();
      UIManager.refreshCurrentView();
      UIManager.showToast('Datos de ejemplo restablecidos.');
    }
  });

  // Limpiar todos los datos
  document.getElementById('btn-clear-all')?.addEventListener('click', () => {
    if (confirm('ATENCIÓN: ¿Deseas borrar TODOS tus movimientos, deudas, metas y facturas? Esta acción es irreversible.')) {
      StorageManager.clearAllData();
      UIManager.refreshCurrentView();
      UIManager.showToast('Todos los datos han sido eliminados.', 'warning');
    }
  });
}
