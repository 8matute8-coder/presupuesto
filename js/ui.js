/**
 * ui.js - Renderizado de interfaz de usuario, componentes reactivos, tablas y modales
 */

class UIManager {
  static currentTab = 'dashboard';
  static selectedMonth = new Date().toISOString().slice(0, 7);

  static formatCurrency(amount, symbol = '$') {
    const num = Number(amount) || 0;
    return `${symbol} ${num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  static showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      warning: 'bg-amber-600 text-white',
      info: 'bg-blue-600 text-white'
    };

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.className = `toast ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
      <span class="text-base font-bold">${icons[type]}</span>
      <span class="flex-1">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /**
   * Renderiza el Dashboard Principal
   */
  static renderDashboard() {
    const config = StorageManager.getConfig();
    const transactions = StorageManager.getTransactions();
    const bills = StorageManager.getBills();
    const debts = StorageManager.getDebts();

    const summary = FinanceLogic.getMonthSummary(transactions, this.selectedMonth);
    const budget503020 = FinanceLogic.calculate503020(summary, config.monthlyExpectedIncome);
    const health = FinanceLogic.calculateHealthScore(summary, budget503020, debts, bills);
    const upcomingBills = FinanceLogic.getUpcomingBills(bills);

    // 1. Métricas Principales (KPIs)
    const kpiContainer = document.getElementById('dashboard-kpis');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm interactive-card">
          <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Ingresos Totales</span>
            <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <i data-lucide="arrow-down-left" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">
            ${this.formatCurrency(summary.totalIncome, config.currencySymbol)}
          </div>
          <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
            ${summary.totalIncome === 0 ? `Estimado base: ${this.formatCurrency(config.monthlyExpectedIncome, config.currencySymbol)}` : `${summary.transactionCount} movimientos`}
          </div>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm interactive-card">
          <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Gastos Totales</span>
            <div class="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">
            ${this.formatCurrency(summary.totalExpenses, config.currencySymbol)}
          </div>
          <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
            ${summary.totalIncome > 0 ? `${((summary.totalExpenses / summary.totalIncome) * 100).toFixed(0)}% del ingreso gastado` : 'Registra tus gastos'}
          </div>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm interactive-card">
          <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Saldo Disponible</span>
            <div class="w-8 h-8 rounded-full ${summary.netBalance >= 0 ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' : 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'} flex items-center justify-center">
              <i data-lucide="wallet" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-2xl font-bold ${summary.netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
            ${this.formatCurrency(summary.netBalance, config.currencySymbol)}
          </div>
          <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
            ${summary.netBalance >= 0 ? 'Superávit mensual' : 'Déficit en el periodo'}
          </div>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm interactive-card">
          <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Salud Financiera</span>
            <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <i data-lucide="activity" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-slate-900 dark:text-white">${health.score}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">/100</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${
              health.score >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
              health.score >= 60 ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
              'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }">
              ${health.level}
            </span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div class="bg-indigo-600 h-full rounded-full progress-bar-fill" style="width: ${health.score}%"></div>
          </div>
        </div>
      `;
    }

    // 2. Tarjetas de la Regla 50/30/20 (BBVA)
    const ruleContainer = document.getElementById('dashboard-503020');
    if (ruleContainer) {
      const getPill = (cat) => {
        if (cat.color === 'emerald') return '<span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">✓ Óptimo</span>';
        if (cat.color === 'amber') return '<span class="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">⚠ Límite</span>';
        return '<span class="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">✕ Excedido</span>';
      };

      ruleContainer.innerHTML = `
        <!-- Necesidades (50%) -->
        <div class="p-5 rounded-2xl border border-blue-100 dark:border-blue-950/50 bg-blue-50/40 dark:bg-blue-950/20">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <h4 class="font-semibold text-slate-800 dark:text-slate-200 text-sm">Necesidades Básicas (50%)</h4>
            </div>
            ${getPill(budget503020.needs)}
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Vivienda, Servicios, Supermercado, Transporte, Salud</p>
          <div class="flex items-baseline justify-between mb-1 text-sm">
            <span class="font-bold text-slate-900 dark:text-white">${this.formatCurrency(budget503020.needs.spent, config.currencySymbol)}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">Meta: ${this.formatCurrency(budget503020.needs.target, config.currencySymbol)}</span>
          </div>
          <div class="w-full bg-blue-200/60 dark:bg-blue-950 h-2 rounded-full overflow-hidden">
            <div class="bg-blue-600 h-full rounded-full progress-bar-fill" style="width: ${budget503020.needs.progressPercent}%"></div>
          </div>
          <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>Consumido: ${budget503020.needs.percentOfIncome.toFixed(1)}%</span>
            <span>${budget503020.needs.remaining >= 0 ? `Disponible: ${this.formatCurrency(budget503020.needs.remaining, config.currencySymbol)}` : `Exceso: ${this.formatCurrency(Math.abs(budget503020.needs.remaining), config.currencySymbol)}`}</span>
          </div>
        </div>

        <!-- Deseos (30%) -->
        <div class="p-5 rounded-2xl border border-amber-100 dark:border-amber-950/50 bg-amber-50/40 dark:bg-amber-950/20">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h4 class="font-semibold text-slate-800 dark:text-slate-200 text-sm">Deseos y Caprichos (30%)</h4>
            </div>
            ${getPill(budget503020.wants)}
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Salidas, Restaurantes, Streaming, Ropa, Hobbies</p>
          <div class="flex items-baseline justify-between mb-1 text-sm">
            <span class="font-bold text-slate-900 dark:text-white">${this.formatCurrency(budget503020.wants.spent, config.currencySymbol)}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">Meta: ${this.formatCurrency(budget503020.wants.target, config.currencySymbol)}</span>
          </div>
          <div class="w-full bg-amber-200/60 dark:bg-amber-950 h-2 rounded-full overflow-hidden">
            <div class="bg-amber-500 h-full rounded-full progress-bar-fill" style="width: ${budget503020.wants.progressPercent}%"></div>
          </div>
          <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>Consumido: ${budget503020.wants.percentOfIncome.toFixed(1)}%</span>
            <span>${budget503020.wants.remaining >= 0 ? `Disponible: ${this.formatCurrency(budget503020.wants.remaining, config.currencySymbol)}` : `Exceso: ${this.formatCurrency(Math.abs(budget503020.wants.remaining), config.currencySymbol)}`}</span>
          </div>
        </div>

        <!-- Ahorro / Deuda (20%) -->
        <div class="p-5 rounded-2xl border border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h4 class="font-semibold text-slate-800 dark:text-slate-200 text-sm">Ahorro / Pago Deuda (20%)</h4>
            </div>
            ${getPill(budget503020.savings)}
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Fondo de reserva, Inversiones, Cancelar cuotas</p>
          <div class="flex items-baseline justify-between mb-1 text-sm">
            <span class="font-bold text-slate-900 dark:text-white">${this.formatCurrency(budget503020.savings.spent, config.currencySymbol)}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">Meta: ${this.formatCurrency(budget503020.savings.target, config.currencySymbol)}</span>
          </div>
          <div class="w-full bg-emerald-200/60 dark:bg-emerald-950 h-2 rounded-full overflow-hidden">
            <div class="bg-emerald-500 h-full rounded-full progress-bar-fill" style="width: ${budget503020.savings.progressPercent}%"></div>
          </div>
          <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>Tasa de Ahorro: ${budget503020.savings.percentOfIncome.toFixed(1)}%</span>
            <span>${budget503020.savings.spent >= budget503020.savings.target ? '✓ Meta Cumplida' : `Falta: ${this.formatCurrency(budget503020.savings.remaining, config.currencySymbol)}`}</span>
          </div>
        </div>
      `;
    }

    // 3. Renderizar Gráfico de Donut en Dashboard
    ChartsManager.renderCategoryChart('dashboard-category-chart', summary.categoryBreakdown, config.currencySymbol);

    // 4. Próximos Vencimientos (Widget Washington Trust)
    const upcomingContainer = document.getElementById('dashboard-upcoming-bills');
    if (upcomingContainer) {
      const topBills = upcomingBills.slice(0, 4);
      if (topBills.length === 0) {
        upcomingContainer.innerHTML = '<p class="text-xs text-slate-400 py-4 text-center">No hay facturas registradas.</p>';
      } else {
        upcomingContainer.innerHTML = topBills.map(b => `
          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <button onclick="UIManager.toggleBillPaid('${b.id}')" class="w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${b.isPaid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'}">
                ${b.isPaid ? '✓' : ''}
              </button>
              <div>
                <div class="text-sm font-semibold text-slate-800 dark:text-slate-200 ${b.isPaid ? 'line-through opacity-60' : ''}">${b.name}</div>
                <div class="text-xs text-slate-400">Vence: Día ${b.dueDay} de cada mes</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold text-slate-900 dark:text-white">${this.formatCurrency(b.amount, config.currencySymbol)}</div>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                b.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                b.status === 'overdue' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                b.status === 'due-soon' || b.status === 'due-today' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }">${b.statusText}</span>
            </div>
          </div>
        `).join('');
      }
    }

    // 5. Consejos y Diagnóstico Dinámico
    const tipsContainer = document.getElementById('dashboard-tips');
    if (tipsContainer) {
      if (health.tips.length === 0) {
        tipsContainer.innerHTML = `
          <div class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
            <span class="text-lg">🎉</span>
            <span>¡Excelente disciplina financiera! Estás cumpliendo tus presupuestos y metas de ahorro del mes según las guías de Galicia y BBVA.</span>
          </div>
        `;
      } else {
        tipsContainer.innerHTML = health.tips.map(tip => `
          <div class="p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
            tip.type === 'danger' ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300' :
            tip.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300' :
            'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300'
          }">
            <span class="text-base">${tip.type === 'danger' ? '🚨' : tip.type === 'warning' ? '💡' : '📌'}</span>
            <span class="leading-relaxed">${tip.text}</span>
          </div>
        `).join('');
      }
    }

    if (window.lucide) lucide.createIcons();
  }

  /**
   * Renderiza la vista de Lista de Movimientos
   */
  static renderTransactions() {
    const config = StorageManager.getConfig();
    const transactions = StorageManager.getTransactions();
    const tableBody = document.getElementById('transactions-table-body');
    const countBadge = document.getElementById('transactions-count-badge');
    const searchInput = document.getElementById('tx-search-input');
    const filterCat = document.getElementById('tx-filter-category');
    const filterClass = document.getElementById('tx-filter-class');

    const query = (searchInput ? searchInput.value.toLowerCase() : '');
    const selectedCat = (filterCat ? filterCat.value : 'all');
    const selectedClass = (filterClass ? filterClass.value : 'all');

    let filtered = transactions.filter(t => t.date.startsWith(this.selectedMonth));

    if (query) {
      filtered = filtered.filter(t => 
        (t.category && t.category.toLowerCase().includes(query)) ||
        (t.notes && t.notes.toLowerCase().includes(query)) ||
        (t.paymentMethod && t.paymentMethod.toLowerCase().includes(query))
      );
    }

    if (selectedCat !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCat);
    }

    if (selectedClass !== 'all') {
      filtered = filtered.filter(t => t.classification === selectedClass);
    }

    // Ordenar de más reciente a más antiguo
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (countBadge) countBadge.textContent = `${filtered.length} movimientos`;

    if (!tableBody) return;

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-slate-400 text-sm">
            No se encontraron movimientos para los filtros seleccionados.
          </td>
        </tr>
      `;
      return;
    }

    const getClassBadge = (cls) => {
      if (cls === 'need') return '<span class="badge-need text-xs px-2.5 py-0.5 rounded-full font-medium">Necesidad 50%</span>';
      if (cls === 'want') return '<span class="badge-want text-xs px-2.5 py-0.5 rounded-full font-medium">Deseo 30%</span>';
      if (cls === 'savings') return '<span class="badge-savings text-xs px-2.5 py-0.5 rounded-full font-medium">Ahorro/Deuda 20%</span>';
      return '<span class="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-medium">Ingreso</span>';
    };

    tableBody.innerHTML = filtered.map(t => `
      <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
        <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">${t.date}</td>
        <td class="py-3.5 px-4">
          <div class="font-semibold text-sm text-slate-800 dark:text-slate-200">${t.category}</div>
          ${t.notes ? `<div class="text-xs text-slate-400 truncate max-w-xs">${t.notes}</div>` : ''}
        </td>
        <td class="py-3.5 px-4">${getClassBadge(t.classification)}</td>
        <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">${t.paymentMethod || 'Efectivo'}</td>
        <td class="py-3.5 px-4 text-right font-bold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}">
          ${t.type === 'income' ? '+' : '-'} ${this.formatCurrency(t.amount, config.currencySymbol)}
        </td>
        <td class="py-3.5 px-4 text-right">
          <button onclick="UIManager.deleteTransaction('${t.id}')" class="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg transition-colors" title="Eliminar">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
  }

  /**
   * Renderiza el Módulo de la Regla 50/30/20 (BBVA)
   */
  static render503020View() {
    const config = StorageManager.getConfig();
    const transactions = StorageManager.getTransactions();
    const summary = FinanceLogic.getMonthSummary(transactions, this.selectedMonth);
    const budget = FinanceLogic.calculate503020(summary, config.monthlyExpectedIncome);

    const baseEl = document.getElementById('calc-base-income');
    if (baseEl) baseEl.value = budget.baseIncome;

    const targetNeedsEl = document.getElementById('calc-target-needs');
    const targetWantsEl = document.getElementById('calc-target-wants');
    const targetSavingsEl = document.getElementById('calc-target-savings');

    if (targetNeedsEl) targetNeedsEl.textContent = this.formatCurrency(budget.needs.target, config.currencySymbol);
    if (targetWantsEl) targetWantsEl.textContent = this.formatCurrency(budget.wants.target, config.currencySymbol);
    if (targetSavingsEl) targetSavingsEl.textContent = this.formatCurrency(budget.savings.target, config.currencySymbol);

    // Actualizar gráfico comparativo
    ChartsManager.render503020Chart('rule-503020-bar-chart', budget, config.currencySymbol);

    if (window.lucide) lucide.createIcons();
  }

  /**
   * Renderiza el Método de 3 Pasos (Galicia)
   */
  static render3StepsView() {
    const config = StorageManager.getConfig();
    const debts = StorageManager.getDebts();
    const goals = StorageManager.getGoals();
    const debtAnalysis = FinanceLogic.getDebtStrategies(debts);

    // Paso 2: Deudas (Bola de Nieve vs Avalancha)
    const strategy = config.debtStrategy || 'snowball';
    const debtList = strategy === 'snowball' ? debtAnalysis.snowball : debtAnalysis.avalanche;

    const debtsContainer = document.getElementById('debts-list-container');
    const debtSummaryEl = document.getElementById('debt-summary-stats');

    if (debtSummaryEl) {
      debtSummaryEl.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
          <div>Deuda Total Restante: <strong class="text-slate-900 dark:text-white">${this.formatCurrency(debtAnalysis.totalDebt, config.currencySymbol)}</strong></div>
          <div>Pago Mínimo Mensual Sumado: <strong class="text-slate-900 dark:text-white">${this.formatCurrency(debtAnalysis.totalMinPayment, config.currencySymbol)}</strong></div>
          <div>Estrategia activa: <strong class="text-blue-600 dark:text-blue-400 capitalize">${strategy === 'snowball' ? 'Bola de Nieve (Menor saldo primero)' : 'Avalancha (Mayor interés primero)'}</strong></div>
        </div>
      `;
    }

    if (debtsContainer) {
      if (debtList.length === 0) {
        debtsContainer.innerHTML = '<p class="text-sm text-slate-400 py-6 text-center">¡Felicitaciones! No tienes deudas registradas.</p>';
      } else {
        debtsContainer.innerHTML = debtList.map((d, index) => {
          const progress = d.totalAmount > 0 ? Math.min(100, ((d.totalAmount - d.remainingAmount) / d.totalAmount) * 100) : 0;
          return `
            <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs flex items-center justify-center">#${index + 1}</span>
                  <div>
                    <h4 class="font-bold text-slate-900 dark:text-white text-sm">${d.name}</h4>
                    <div class="text-xs text-slate-400">Tasa: ${d.interestRate}% TEA | Pago Mínimo: ${this.formatCurrency(d.minimumPayment, config.currencySymbol)}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-slate-900 dark:text-white text-sm">${this.formatCurrency(d.remainingAmount, config.currencySymbol)}</div>
                  <div class="text-xs text-slate-400">de ${this.formatCurrency(d.totalAmount, config.currencySymbol)}</div>
                </div>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                <div class="bg-emerald-500 h-full rounded-full" style="width: ${progress}%"></div>
              </div>
              <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span class="text-slate-500 dark:text-slate-400">${progress.toFixed(0)}% amortizado</span>
                <div class="flex gap-2">
                  <button onclick="UIManager.promptPayDebt('${d.id}')" class="px-2.5 py-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 font-semibold transition-colors">Registrar Pago</button>
                  <button onclick="UIManager.deleteDebt('${d.id}')" class="p-1 text-slate-400 hover:text-rose-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Paso 3: Metas de Ahorro y Fondo de Emergencia
    const goalsContainer = document.getElementById('goals-list-container');
    if (goalsContainer) {
      if (goals.length === 0) {
        goalsContainer.innerHTML = '<p class="text-sm text-slate-400 py-6 text-center">No has creado metas de ahorro todavía.</p>';
      } else {
        goalsContainer.innerHTML = goals.map(g => {
          const pacing = FinanceLogic.calculateGoalPacing(g);
          return `
            <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <i data-lucide="${g.icon || 'target'}" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 dark:text-white text-sm">${g.name}</h4>
                    <div class="text-xs text-slate-400">Meta para: ${g.deadline || 'Sin fecha fija'} (${pacing.monthsLeft} meses)</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-emerald-600 dark:text-emerald-400 text-sm">${this.formatCurrency(g.currentAmount, config.currencySymbol)}</div>
                  <div class="text-xs text-slate-400">Objetivo: ${this.formatCurrency(g.targetAmount, config.currencySymbol)}</div>
                </div>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden my-3">
                <div class="bg-emerald-500 h-full rounded-full" style="width: ${pacing.progress}%"></div>
              </div>
              <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span class="text-slate-500 dark:text-slate-400">Ahorro mensual sugerido: <strong>${this.formatCurrency(pacing.suggestedMonthly, config.currencySymbol)}/mes</strong></span>
                <div class="flex gap-2">
                  <button onclick="UIManager.promptAddGoalContribution('${g.id}')" class="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 font-semibold transition-colors">+ Aportar</button>
                  <button onclick="UIManager.deleteGoal('${g.id}')" class="p-1 text-slate-400 hover:text-rose-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    if (window.lucide) lucide.createIcons();
  }

  /**
   * Renderiza el Módulo de Facturas y Organización (Washington Trust)
   */
  static renderBillsAndOrgView() {
    const config = StorageManager.getConfig();
    const bills = StorageManager.getBills();
    const upcomingBills = FinanceLogic.getUpcomingBills(bills);
    const billsContainer = document.getElementById('bills-full-list');

    if (billsContainer) {
      if (upcomingBills.length === 0) {
        billsContainer.innerHTML = '<p class="text-sm text-slate-400 py-6 text-center">No hay facturas ni vencimientos registrados.</p>';
      } else {
        billsContainer.innerHTML = upcomingBills.map(b => `
          <div class="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
            <div class="flex items-center gap-3">
              <button onclick="UIManager.toggleBillPaid('${b.id}')" class="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${b.isPaid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'}">
                ${b.isPaid ? '✓' : ''}
              </button>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white text-sm ${b.isPaid ? 'line-through opacity-60' : ''}">${b.name}</h4>
                <div class="text-xs text-slate-400">Categoría: ${b.category || 'General'} | Vence el día ${b.dueDay}</div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-right">
                <div class="font-bold text-slate-900 dark:text-white text-sm">${this.formatCurrency(b.amount, config.currencySymbol)}</div>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${
                  b.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                  b.status === 'overdue' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                  b.status === 'due-soon' || b.status === 'due-today' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }">${b.statusText}</span>
              </div>
              <button onclick="UIManager.deleteBill('${b.id}')" class="text-slate-400 hover:text-rose-500 p-1">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `).join('');
      }
    }

    // Calculadora "Págate a ti primero"
    const autoSaveIncome = document.getElementById('auto-save-income');
    const autoSaveResult = document.getElementById('auto-save-result');
    if (autoSaveIncome && autoSaveResult) {
      const incomeVal = Number(autoSaveIncome.value) || config.monthlyExpectedIncome;
      autoSaveIncome.value = incomeVal;
      autoSaveResult.textContent = this.formatCurrency(incomeVal * 0.20, config.currencySymbol);
    }

    if (window.lucide) lucide.createIcons();
  }

  /**
   * Renderiza el Módulo de Analítica y Reportes
   */
  static renderAnalyticsView() {
    const config = StorageManager.getConfig();
    const transactions = StorageManager.getTransactions();
    const summary = FinanceLogic.getMonthSummary(transactions, this.selectedMonth);

    // Gráfico de línea de gasto acumulado
    ChartsManager.renderDailyTrendChart('analytics-daily-trend-chart', transactions, this.selectedMonth, config.currencySymbol);
    ChartsManager.renderCategoryChart('analytics-category-chart', summary.categoryBreakdown, config.currencySymbol);

    // Tabla de desglose de categorías
    const tableContainer = document.getElementById('analytics-category-table');
    if (tableContainer) {
      const entries = Object.entries(summary.categoryBreakdown).sort((a, b) => b[1] - a[1]);
      if (entries.length === 0) {
        tableContainer.innerHTML = '<p class="text-sm text-slate-400 py-4 text-center">Sin gastos registrados este mes.</p>';
      } else {
        tableContainer.innerHTML = entries.map(([cat, amount]) => {
          const pct = summary.totalExpenses > 0 ? ((amount / summary.totalExpenses) * 100).toFixed(1) : 0;
          return `
            <div class="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 text-sm">
              <span class="font-medium text-slate-700 dark:text-slate-300">${cat}</span>
              <div class="text-right">
                <span class="font-bold text-slate-900 dark:text-white">${this.formatCurrency(amount, config.currencySymbol)}</span>
                <span class="text-xs text-slate-400 ml-2">(${pct}%)</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    if (window.lucide) lucide.createIcons();
  }

  /**
   * Renderiza Configuración
   */
  static renderSettingsView() {
    const config = StorageManager.getConfig();
    const currencySelect = document.getElementById('setting-currency');
    const incomeInput = document.getElementById('setting-expected-income');
    const strategySelect = document.getElementById('setting-debt-strategy');

    if (currencySelect) currencySelect.value = config.currency || 'ARS';
    if (incomeInput) incomeInput.value = config.monthlyExpectedIncome || 0;
    if (strategySelect) strategySelect.value = config.debtStrategy || 'snowball';
  }

  // --- Handlers de Acciones ---

  static toggleBillPaid(billId) {
    const bills = StorageManager.getBills();
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      bill.isPaid = !bill.isPaid;
      StorageManager.saveBills(bills);
      this.refreshCurrentView();
      this.showToast(`Factura marcada como ${bill.isPaid ? 'pagada' : 'pendiente'}`);
    }
  }

  static deleteTransaction(id) {
    if (confirm('¿Eliminar este movimiento?')) {
      let transactions = StorageManager.getTransactions();
      transactions = transactions.filter(t => t.id !== id);
      StorageManager.saveTransactions(transactions);
      this.refreshCurrentView();
      this.showToast('Movimiento eliminado');
    }
  }

  static deleteBill(id) {
    if (confirm('¿Eliminar esta factura recurrente?')) {
      let bills = StorageManager.getBills();
      bills = bills.filter(b => b.id !== id);
      StorageManager.saveBills(bills);
      this.refreshCurrentView();
      this.showToast('Factura eliminada');
    }
  }

  static deleteDebt(id) {
    if (confirm('¿Eliminar este registro de deuda?')) {
      let debts = StorageManager.getDebts();
      debts = debts.filter(d => d.id !== id);
      StorageManager.saveDebts(debts);
      this.refreshCurrentView();
      this.showToast('Deuda eliminada');
    }
  }

  static deleteGoal(id) {
    if (confirm('¿Eliminar esta meta de ahorro?')) {
      let goals = StorageManager.getGoals();
      goals = goals.filter(g => g.id !== id);
      StorageManager.saveGoals(goals);
      this.refreshCurrentView();
      this.showToast('Meta eliminada');
    }
  }

  static promptPayDebt(debtId) {
    const debts = StorageManager.getDebts();
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    const amountStr = prompt(`Registrar pago para "${debt.name}"\nSaldo restante: $${debt.remainingAmount}\nIngresa el monto pagado:`);
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Monto inválido.');
      return;
    }

    debt.remainingAmount = Math.max(0, debt.remainingAmount - amount);
    StorageManager.saveDebts(debts);

    // Opcionalmente registrar como movimiento de Ahorro/Deuda
    const transactions = StorageManager.getTransactions();
    transactions.push({
      id: 'tx-' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type: 'expense',
      amount: amount,
      category: 'Pago de Deudas',
      classification: 'savings',
      paymentMethod: 'Transferencia',
      notes: `Amortización de ${debt.name}`
    });
    StorageManager.saveTransactions(transactions);

    this.refreshCurrentView();
    this.showToast(`Pago de $${amount.toLocaleString()} registrado con éxito.`);
  }

  static promptAddGoalContribution(goalId) {
    const goals = StorageManager.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const amountStr = prompt(`Aportar ahorro a la meta "${goal.name}"\nObjetivo: $${goal.targetAmount}\nAcumulado: $${goal.currentAmount}\nIngresa el monto a aportar:`);
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Monto inválido.');
      return;
    }

    goal.currentAmount = Number(goal.currentAmount || 0) + amount;
    StorageManager.saveGoals(goals);

    // Registrar como movimiento de ahorro
    const transactions = StorageManager.getTransactions();
    transactions.push({
      id: 'tx-' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type: 'expense',
      amount: amount,
      category: 'Ahorro / Fondo Emergencia',
      classification: 'savings',
      paymentMethod: 'Transferencia',
      notes: `Aporte a meta: ${goal.name}`
    });
    StorageManager.saveTransactions(transactions);

    this.refreshCurrentView();
    this.showToast(`¡Aporte de $${amount.toLocaleString()} sumado a ${goal.name}!`);
  }

  static refreshCurrentView() {
    switch (this.currentTab) {
      case 'dashboard': this.renderDashboard(); break;
      case 'transactions': this.renderTransactions(); break;
      case '503020': this.render503020View(); break;
      case '3steps': this.render3StepsView(); break;
      case 'bills': this.renderBillsAndOrgView(); break;
      case 'analytics': this.renderAnalyticsView(); break;
      case 'settings': this.renderSettingsView(); break;
    }
  }

  static switchTab(tabName) {
    this.currentTab = tabName;
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const targetContent = document.getElementById(`tab-content-${tabName}`);
    const targetBtn = document.getElementById(`tab-btn-${tabName}`);

    if (targetContent) targetContent.classList.remove('hidden');
    if (targetBtn) targetBtn.classList.add('active');

    this.refreshCurrentView();
  }
}
