/**
 * app.js - Orquestador principal de la aplicación, inicialización y eventos
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar Almacenamiento Local
  StorageManager.initStorage();

  // 2. Inicializar Firebase (Auth con Google y Cloud Firestore)
  if (typeof FirebaseService !== 'undefined') {
    FirebaseService.init();
  }

  // 3. Inicializar Tema (Claro / Oscuro)
  initTheme();

  // 4. Inicializar Selector de Mes
  initMonthSelector();

  // 5. Inicializar Navegación por Pestañas
  initTabs();

  // 6. Inicializar Modales y Formularios
  initModalsAndForms();

  // 7. Inicializar Eventos de Autenticación Firebase
  initFirebaseAuthEvents();

  // 8. Inicializar Calculadoras Interactivas
  initInteractiveCalculators();

  // 9. Inicializar Eventos de Configuración y Respaldo
  initSettingsAndBackup();

  // 10. Renderizar Vista Inicial (Planilla de Gastos Fijos)
  UIManager.switchTab('fixed_sheet');

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

function initFirebaseAuthEvents() {
  // Botón Iniciar Sesión con Google
  document.getElementById('btn-google-login')?.addEventListener('click', async () => {
    await FirebaseService.loginWithGoogle();
  });

  // Botón Cerrar Sesión
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await FirebaseService.logout();
  });

  // Forzar Sincronización a Firestore
  document.getElementById('btn-force-sync')?.addEventListener('click', async () => {
    if (!FirebaseService.currentUser) {
      UIManager.showToast('Inicia sesión con Google para sincronizar con Firestore', 'warning');
      return;
    }
    await FirebaseService.syncToFirestore();
    UIManager.showToast('Datos sincronizados con Cloud Firestore.');
  });

  // Guardar Credenciales personalizadas de Firebase
  document.getElementById('form-firebase-config')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const apiKey = document.getElementById('fb-api-key').value.trim();
    const appId = document.getElementById('fb-app-id').value.trim();
    const authDomain = document.getElementById('fb-auth-domain').value.trim();
    const projectId = document.getElementById('fb-project-id').value.trim() || 'presu-e7466';

    const customConfig = {
      apiKey,
      appId,
      authDomain,
      projectId,
      storageBucket: `${projectId}.firebasestorage.app`,
      messagingSenderId: appId.split(':')[1] || "389274920194"
    };

    FirebaseConfigManager.saveConfig(customConfig);
    FirebaseService.init();
    UIManager.showToast('Credenciales de Firebase guardadas.');
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
  document.getElementById('btn-open-add-fixed-modal')?.addEventListener('click', () => {
    openModal('modal-add-fixed');
  });

  document.getElementById('btn-open-tx-modal')?.addEventListener('click', () => {
    const dateInput = document.getElementById('tx-date');
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
    openModal('modal-add-transaction');
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

  // Submit: Formulario Nuevo Gasto Fijo
  document.getElementById('form-add-fixed')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const concept = document.getElementById('fixed-concept').value.trim();
    const amount = Number(document.getElementById('fixed-amount').value);
    const category = document.getElementById('fixed-category').value;

    if (!concept || isNaN(amount) || amount < 0) {
      alert('Ingresa un concepto y monto válidos.');
      return;
    }

    const fixed = StorageManager.getFixedExpenses();
    fixed.push({
      id: 'fix-' + Date.now(),
      concept,
      amount,
      isPaid: false,
      category,
      classification: category === 'Salud / Bienestar' ? 'want' : 'need'
    });
    StorageManager.saveFixedExpenses(fixed);

    closeModal('modal-add-fixed');
    document.getElementById('form-add-fixed').reset();
    UIManager.refreshCurrentView();
    UIManager.showToast(`"${concept}" agregado a los gastos fijos.`);
  });

  // Submit: Formulario Movimiento Variable
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

  // Submit: Formulario Deuda
  document.getElementById('form-add-debt')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('debt-name').value;
    const totalAmount = Number(document.getElementById('debt-total').value);
    const remainingAmount = Number(document.getElementById('debt-remaining').value) || totalAmount;

    if (!name || !totalAmount) {
      alert('Completa el nombre y monto de la deuda.');
      return;
    }

    const newDebt = {
      id: 'debt-' + Date.now(),
      name,
      totalAmount,
      remainingAmount,
      interestRate: 60,
      minimumPayment: Math.round(remainingAmount * 0.15)
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

    if (!name || !targetAmount) {
      alert('Completa el nombre y el monto meta.');
      return;
    }

    const newGoal = {
      id: 'goal-' + Date.now(),
      name,
      targetAmount,
      currentAmount,
      deadline: '2026-12-31',
      icon: 'shield-check'
    };

    const goals = StorageManager.getGoals();
    goals.push(newGoal);
    StorageManager.saveGoals(goals);

    closeModal('modal-add-goal');
    document.getElementById('form-add-goal').reset();
    UIManager.refreshCurrentView();
    UIManager.showToast('Nueva meta de ahorro creada.');
  });

  // Búsqueda y filtros de movimientos
  document.getElementById('tx-search-input')?.addEventListener('input', () => UIManager.renderTransactions());
  document.getElementById('tx-filter-class')?.addEventListener('change', () => UIManager.renderTransactions());
}

function initInteractiveCalculators() {
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
}

function initSettingsAndBackup() {
  // Exportar CSV de Gastos Fijos
  document.getElementById('btn-export-sheet-csv')?.addEventListener('click', () => {
    const success = StorageManager.exportCSV(UIManager.selectedMonth);
    if (success) {
      UIManager.showToast('Planilla de gastos fijos exportada a CSV.');
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

  // Restaurar a datos de ejemplo
  document.getElementById('btn-reset-sample')?.addEventListener('click', () => {
    if (confirm('¿Restablecer la planilla a los valores originales de tu imagen?')) {
      StorageManager.resetToSampleData();
      UIManager.refreshCurrentView();
      UIManager.showToast('Planilla restablecida.');
    }
  });

  // Limpiar todos los datos
  document.getElementById('btn-clear-all')?.addEventListener('click', () => {
    if (confirm('ATENCIÓN: ¿Deseas borrar todos los datos?')) {
      StorageManager.clearAllData();
      UIManager.refreshCurrentView();
      UIManager.showToast('Datos eliminados.', 'warning');
    }
  });
}
