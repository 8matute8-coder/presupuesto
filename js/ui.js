/**
 * ui.js - Renderizado de interfaz de usuario, componentes reactivos, tramos de pago y meses
 */

class UIManager {
  static currentTab = 'fixed_sheet';
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

  static updateAuthUI(user) {
    const loginBtn = document.getElementById('btn-google-login');
    const userBadge = document.getElementById('user-profile-badge');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const syncStatusEl = document.getElementById('cloud-sync-status');

    if (user) {
      if (loginBtn) loginBtn.classList.add('hidden');
      if (userBadge) {
        userBadge.classList.remove('hidden');
        userBadge.classList.add('flex');
      }
      if (userAvatar) {
        userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=2563eb&color=fff`;
      }
      if (userName) {
        userName.textContent = user.displayName || user.email.split('@')[0];
      }
      if (syncStatusEl) {
        syncStatusEl.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span><span>Nube activa (Firestore)</span>';
      }
    } else {
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (userBadge) {
        userBadge.classList.add('hidden');
        userBadge.classList.remove('flex');
      }
      if (syncStatusEl) {
        syncStatusEl.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-slate-400 mr-1.5"></span><span>Modo local</span>';
      }
    }
  }

  /**
   * Renderiza la Planilla de Gastos Fijos (Fiel al Excel del usuario con Tramos de Sueldo y Meses)
   */
  static renderFixedSheet() {
    const config = StorageManager.getConfig();
    const incomeConfig = StorageManager.getIncomeConfig();
    const fixedExpenses = StorageManager.getFixedExpenses(this.selectedMonth);
    const summary = FinanceLogic.getFixedExpensesSummary(fixedExpenses, incomeConfig, this.selectedMonth);

    // Formato legible del mes (ej. Agosto 2026)
    const [yearNum, monthNum] = this.selectedMonth.split('-').map(Number);
    const dateObj = new Date(yearNum, monthNum - 1, 1);
    const monthName = dateObj.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // 1. Renderizar Cuadro de Resumen Azul con Desglose de Tramos de Cobro
    const incomeBox = document.getElementById('sheet-summary-box');
    if (incomeBox) {
      const { tramo1, tramo2 } = summary.cashFlow;

      incomeBox.innerHTML = `
        <div class="rounded-2xl p-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-xl space-y-4">
          <div class="flex items-center justify-between border-b border-blue-400/40 pb-2.5">
            <div>
              <span class="text-[11px] font-semibold uppercase tracking-wider text-blue-200">Resumen Financiero</span>
              <h3 class="text-base font-bold text-white">${formattedMonth}</h3>
            </div>
            <button onclick="UIManager.promptEditIncome()" class="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg font-medium transition-colors">
              ✎ Editar Ingresos
            </button>
          </div>
          
          <!-- Números Globales -->
          <div class="grid grid-cols-2 gap-3 text-xs bg-white/10 p-3 rounded-xl">
            <div>
              <span class="text-blue-200 block">Total Ingresos:</span>
              <span class="font-extrabold text-base text-emerald-300">${this.formatCurrency(summary.totalIncome, config.currencySymbol)}</span>
            </div>
            <div>
              <span class="text-blue-200 block">Gastos Fijos (${summary.fixedPercentageOfIncome.toFixed(0)}%):</span>
              <span class="font-extrabold text-base text-amber-300">${this.formatCurrency(summary.totalFixed, config.currencySymbol)}</span>
            </div>
          </div>

          <!-- Esquema de Cobro en 2 Tramos -->
          <div class="space-y-2 border-t border-blue-400/30 pt-3">
            <span class="text-[11px] font-bold uppercase tracking-wider text-blue-200 block">
              🗓️ Cash Flow por Tramos de Sueldo:
            </span>

            <!-- Tramo 1 (Día 1 ~ 19.5%) -->
            <div class="p-2.5 rounded-xl bg-blue-950/40 border border-blue-400/30 text-xs space-y-1">
              <div class="flex justify-between items-center">
                <strong class="text-blue-200">Tramo 1 (Día 1 - 19.5%):</strong>
                <span class="font-bold text-white">${this.formatCurrency(tramo1.income, config.currencySymbol)}</span>
              </div>
              <div class="flex justify-between items-center text-[11px] text-blue-100">
                <span>Fijos asignados (Alquiler + Servicios):</span>
                <span>${this.formatCurrency(tramo1.expenses, config.currencySymbol)}</span>
              </div>
              <div class="flex justify-between items-center pt-1 border-t border-blue-800/60 font-semibold ${tramo1.remainder >= 0 ? 'text-emerald-300' : 'text-rose-300'}">
                <span>Disponible semana 1:</span>
                <span>${this.formatCurrency(tramo1.remainder, config.currencySymbol)}</span>
              </div>
            </div>

            <!-- Tramo 2 (Día 7-10 ~ 80.5%) -->
            <div class="p-2.5 rounded-xl bg-blue-950/40 border border-blue-400/30 text-xs space-y-1">
              <div class="flex justify-between items-center">
                <strong class="text-blue-200">Tramo 2 (Día 7 al 10 - 80.5%):</strong>
                <span class="font-bold text-white">${this.formatCurrency(tramo2.income, config.currencySymbol)}</span>
              </div>
              <div class="flex justify-between items-center text-[11px] text-blue-100">
                <span>Fijos asignados (Facu + Colegios + Tarjeta):</span>
                <span>${this.formatCurrency(tramo2.expenses, config.currencySymbol)}</span>
              </div>
              <div class="flex justify-between items-center pt-1 border-t border-blue-800/60 font-semibold ${tramo2.remainder >= 0 ? 'text-emerald-300' : 'text-rose-300'}">
                <span>Disponible restante:</span>
                <span>${this.formatCurrency(tramo2.remainder, config.currencySymbol)}</span>
              </div>
            </div>
          </div>

          <!-- Resto Total y Promedios Diarios -->
          <div class="space-y-1.5 border-t border-blue-400/30 pt-3 text-xs">
            <div class="flex justify-between items-center">
              <span class="font-semibold text-blue-100">Resto Total Disponible:</span>
              <span class="font-extrabold text-lg text-white">${this.formatCurrency(summary.netRemainder, config.currencySymbol)}</span>
            </div>
            <div class="flex justify-between items-center bg-white/10 p-2 rounded-xl text-xs">
              <span class="text-blue-100">Promedio Diario (${summary.daysInCurrentMonth} días):</span>
              <span class="font-bold text-yellow-300">${this.formatCurrency(summary.dailyAverageMonth, config.currencySymbol)}/día</span>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Renderizar Tabla de Gastos Fijos
    const tableBody = document.getElementById('fixed-sheet-table-body');
    const totalRow = document.getElementById('fixed-sheet-total-row');

    if (tableBody) {
      tableBody.innerHTML = summary.items.map(item => `
        <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors ${item.isPaid ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''}">
          <td class="py-3 px-4">
            <div class="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full ${item.amount > 0 ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}"></span>
              <span>${item.concept}</span>
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
              <button onclick="UIManager.toggleItemTramo('${item.id}')" class="px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${item.tramo === 1 ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'}" title="Clic para alternar tramo de cobro">
                ${item.tramo === 1 ? '📅 Tramo 1 (Día 1)' : '📅 Tramo 2 (Día 7-10)'} ⇄
              </button>
            </div>
          </td>
          <td class="py-3 px-4 text-right">
            <button onclick="UIManager.promptEditFixedAmount('${item.id}')" class="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-sm px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Clic para editar monto">
              ${this.formatCurrency(item.amount, config.currencySymbol)} ✎
            </button>
          </td>
          <td class="py-3 px-4 text-center">
            <button onclick="UIManager.toggleFixedPaid('${item.id}')" class="w-6 h-6 mx-auto rounded-lg border-2 flex items-center justify-center font-bold text-xs transition-colors ${item.isPaid ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 text-transparent'}">
              ✓
            </button>
          </td>
          <td class="py-3 px-4 text-right font-medium text-xs text-slate-600 dark:text-slate-400">
            ${item.pctOfIncome > 0 ? `${item.pctOfIncome.toFixed(2)}%` : '-'}
          </td>
          <td class="py-3 px-4 text-right">
            <button onclick="UIManager.deleteFixedExpense('${item.id}')" class="text-slate-400 hover:text-rose-500 p-1" title="Eliminar">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    if (totalRow) {
      totalRow.innerHTML = `
        <tr class="bg-blue-600 text-white font-bold text-sm">
          <td class="py-3 px-4">TOTAL GASTOS FIJOS</td>
          <td class="py-3 px-4 text-right">${this.formatCurrency(summary.totalFixed, config.currencySymbol)}</td>
          <td class="py-3 px-4 text-center">${summary.items.filter(i => i.isPaid).length}/${summary.items.filter(i => i.amount > 0).length}</td>
          <td class="py-3 px-4 text-right">${summary.fixedPercentageOfIncome.toFixed(2)}%</td>
          <td class="py-3 px-4"></td>
        </tr>
      `;
    }

    // 3. Gráfico Donut de Gastos Fijos
    ChartsManager.renderFixedExpensesChart('sheet-donut-chart', summary.items, config.currencySymbol);

    if (window.lucide) lucide.createIcons();
  }

  static toggleItemTramo(id) {
    const fixed = StorageManager.getFixedExpenses(this.selectedMonth);
    const item = fixed.find(f => f.id === id);
    if (item) {
      item.tramo = item.tramo === 1 ? 2 : 1;
      StorageManager.saveFixedExpenses(fixed, this.selectedMonth);
      this.refreshCurrentView();
      this.showToast(`"${item.concept}" asignado a Tramo ${item.tramo}`);
    }
  }

  static promptResetMonthPayments() {
    const [y, m] = this.selectedMonth.split('-').map(Number);
    const monthName = new Date(y, m - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    if (confirm(`¿Deseas reiniciar los estados de 'Pagado' para ${monthName}?\n\nLos montos y conceptos se mantendrán intactos y los meses anteriores no sufrirán cambios.`)) {
      StorageManager.resetMonthPayments(this.selectedMonth);
      this.refreshCurrentView();
      this.showToast(`Pagos de ${monthName} reiniciados para el nuevo mes.`);
    }
  }

  /**
   * Renderiza el Dashboard Principal
   */
  static renderDashboard() {
    const config = StorageManager.getConfig();
    const incomeConfig = StorageManager.getIncomeConfig();
    const transactions = StorageManager.getTransactions();
    const fixedExpenses = StorageManager.getFixedExpenses(this.selectedMonth);
    const debts = StorageManager.getDebts();

    const fixedSummary = FinanceLogic.getFixedExpensesSummary(fixedExpenses, incomeConfig, this.selectedMonth);
    const summary = FinanceLogic.getMonthSummary(transactions, this.selectedMonth, fixedExpenses, incomeConfig);
    const budget503020 = FinanceLogic.calculate503020(summary, fixedSummary);
    const health = FinanceLogic.calculateHealthScore(summary, budget503020, debts, fixedSummary);

    // 1. KPIs
    const kpiContainer = document.getElementById('dashboard-kpis');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm interactive-card">
          <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Ingresos Mensuales</span>
            <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <i data-lucide="arrow-down-left" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">
            ${this.formatCurrency(fixedSummary.totalIncome, config.currencySymbol)}
          </div>
          <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Tramo 1 (19.5%): ${this.formatCurrency(fixedSummary.cashFlow.tramo1.income)} | Tramo 2: ${this.formatCurrency(fixedSummary.cashFlow.tramo2.income)}
          </div>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm interactive-card">
          <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Gastos Fijos (${fixedSummary.fixedPercentageOfIncome.toFixed(0)}%)</span>
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <i data-lucide="calculator" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">
            ${this.formatCurrency(fixedSummary.totalFixed, config.currencySymbol)}
          </div>
          <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Pagado: ${this.formatCurrency(fixedSummary.totalPaid)} | Pendiente: ${this.formatCurrency(fixedSummary.totalPending)}
          </div>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm interactive-card">
          <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Resto / Disponible</span>
            <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <i data-lucide="wallet" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ${this.formatCurrency(fixedSummary.netRemainder, config.currencySymbol)}
          </div>
          <div class="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Promedio: ${this.formatCurrency(fixedSummary.dailyAverageMonth, config.currencySymbol)}/día
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
            <span class="text-xs px-2 py-0.5 rounded-full font-medium ml-auto bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ${health.level}
            </span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div class="bg-indigo-600 h-full rounded-full progress-bar-fill" style="width: ${health.score}%"></div>
          </div>
        </div>
      `;
    }

    // 2. Tarjetas de 50/30/20
    const ruleContainer = document.getElementById('dashboard-503020');
    if (ruleContainer) {
      ruleContainer.innerHTML = `
        <div class="p-5 rounded-2xl border border-blue-100 dark:border-blue-950/50 bg-blue-50/40 dark:bg-blue-950/20">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-semibold text-slate-800 dark:text-slate-200 text-sm">Necesidades (50%)</h4>
            <span class="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded">Fijos: ${fixedSummary.fixedPercentageOfIncome.toFixed(0)}%</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Alquiler, Colegios, Servicios, Facu</p>
          <div class="text-lg font-bold text-slate-900 dark:text-white">${this.formatCurrency(fixedSummary.totalFixed, config.currencySymbol)}</div>
          <div class="w-full bg-blue-200/60 dark:bg-blue-950 h-2 rounded-full overflow-hidden mt-2">
            <div class="bg-blue-600 h-full rounded-full" style="width: ${Math.min(100, (fixedSummary.totalFixed / budget503020.needs.target) * 100)}%"></div>
          </div>
        </div>

        <div class="p-5 rounded-2xl border border-amber-100 dark:border-amber-950/50 bg-amber-50/40 dark:bg-amber-950/20">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-semibold text-slate-800 dark:text-slate-200 text-sm">Deseos & Ocio (30%)</h4>
            <span class="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">Meta: 30%</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Salidas, Compras, Gimnasio</p>
          <div class="text-lg font-bold text-slate-900 dark:text-white">${this.formatCurrency(budget503020.wants.target, config.currencySymbol)}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-2">Tope sugerido mensual</div>
        </div>

        <div class="p-5 rounded-2xl border border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-semibold text-slate-800 dark:text-slate-200 text-sm">Ahorro / Deuda (20%)</h4>
            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">Meta: 20%</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Fondo de reserva, Inversiones</p>
          <div class="text-lg font-bold text-emerald-600 dark:text-emerald-400">${this.formatCurrency(budget503020.savings.target, config.currencySymbol)}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-2">Aporte sugerido "Págate primero"</div>
        </div>
      `;
    }

    // 3. Gráfico Donut
    ChartsManager.renderFixedExpensesChart('dashboard-category-chart', fixedSummary.items, config.currencySymbol);

    // 4. Consejos
    const tipsContainer = document.getElementById('dashboard-tips');
    if (tipsContainer) {
      tipsContainer.innerHTML = health.tips.map(tip => `
        <div class="p-3.5 rounded-xl border text-xs flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300">
          <span class="text-base">💡</span>
          <span class="leading-relaxed">${tip.text}</span>
        </div>
      `).join('');
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
    const filterClass = document.getElementById('tx-filter-class');

    const query = (searchInput ? searchInput.value.toLowerCase() : '');
    const selectedClass = (filterClass ? filterClass.value : 'all');

    let filtered = transactions.filter(t => t.date.startsWith(this.selectedMonth));

    if (query) {
      filtered = filtered.filter(t => 
        (t.category && t.category.toLowerCase().includes(query)) ||
        (t.notes && t.notes.toLowerCase().includes(query)) ||
        (t.paymentMethod && t.paymentMethod.toLowerCase().includes(query))
      );
    }

    if (selectedClass !== 'all') filtered = filtered.filter(t => t.classification === selectedClass);

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (countBadge) countBadge.textContent = `${filtered.length} movimientos`;
    if (!tableBody) return;

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-8 text-center text-slate-400 text-sm">
            No hay movimientos registrados en este mes.
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
        <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">${t.paymentMethod || 'Transferencia'}</td>
        <td class="py-3.5 px-4 text-right font-bold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}">
          ${t.type === 'income' ? '+' : '-'} ${this.formatCurrency(t.amount, config.currencySymbol)}
        </td>
        <td class="py-3.5 px-4 text-right">
          <button onclick="UIManager.deleteTransaction('${t.id}')" class="text-slate-400 hover:text-rose-600 p-1" title="Eliminar">
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
    const incomeConfig = StorageManager.getIncomeConfig();
    const transactions = StorageManager.getTransactions();
    const fixedExpenses = StorageManager.getFixedExpenses(this.selectedMonth);
    const fixedSummary = FinanceLogic.getFixedExpensesSummary(fixedExpenses, incomeConfig, this.selectedMonth);
    const summary = FinanceLogic.getMonthSummary(transactions, this.selectedMonth, fixedExpenses, incomeConfig);
    const budget = FinanceLogic.calculate503020(summary, fixedSummary);

    const baseEl = document.getElementById('calc-base-income');
    if (baseEl) baseEl.value = budget.baseIncome;

    const targetNeedsEl = document.getElementById('calc-target-needs');
    const targetWantsEl = document.getElementById('calc-target-wants');
    const targetSavingsEl = document.getElementById('calc-target-savings');

    if (targetNeedsEl) targetNeedsEl.textContent = this.formatCurrency(budget.needs.target, config.currencySymbol);
    if (targetWantsEl) targetWantsEl.textContent = this.formatCurrency(budget.wants.target, config.currencySymbol);
    if (targetSavingsEl) targetSavingsEl.textContent = this.formatCurrency(budget.savings.target, config.currencySymbol);

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

    const strategy = config.debtStrategy || 'snowball';
    const debtList = strategy === 'snowball' ? debtAnalysis.snowball : debtAnalysis.avalanche;

    const debtsContainer = document.getElementById('debts-list-container');
    const debtSummaryEl = document.getElementById('debt-summary-stats');

    if (debtSummaryEl) {
      debtSummaryEl.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
          <div>Deuda Total: <strong class="text-slate-900 dark:text-white">${this.formatCurrency(debtAnalysis.totalDebt, config.currencySymbol)}</strong></div>
          <div>Pago Mínimo Mensual: <strong class="text-slate-900 dark:text-white">${this.formatCurrency(debtAnalysis.totalMinPayment, config.currencySymbol)}</strong></div>
          <div>Estrategia: <strong class="text-blue-600 dark:text-blue-400 capitalize">${strategy === 'snowball' ? 'Bola de Nieve' : 'Avalancha'}</strong></div>
        </div>
      `;
    }

    if (debtsContainer) {
      debtsContainer.innerHTML = debtList.map((d, index) => {
        const progress = d.totalAmount > 0 ? Math.min(100, ((d.totalAmount - d.remainingAmount) / d.totalAmount) * 100) : 0;
        return `
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white text-sm">#${index + 1} ${d.name}</h4>
                <div class="text-xs text-slate-400">Tasa: ${d.interestRate}% TEA | Pago Mínimo: ${this.formatCurrency(d.minimumPayment, config.currencySymbol)}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-slate-900 dark:text-white text-sm">${this.formatCurrency(d.remainingAmount, config.currencySymbol)}</div>
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

    const goalsContainer = document.getElementById('goals-list-container');
    if (goalsContainer) {
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
                  <div class="text-xs text-slate-400">Meta: ${g.deadline || 'Sin fecha'} (${pacing.monthsLeft} meses)</div>
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
              <span class="text-slate-500 dark:text-slate-400">Ahorro mensual: <strong>${this.formatCurrency(pacing.suggestedMonthly, config.currencySymbol)}/mes</strong></span>
              <div class="flex gap-2">
                <button onclick="UIManager.promptAddGoalContribution('${g.id}')" class="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold transition-colors">+ Aportar</button>
                <button onclick="UIManager.deleteGoal('${g.id}')" class="p-1 text-slate-400 hover:text-rose-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) lucide.createIcons();
  }

  // --- Handlers de Acciones de Planilla ---

  static promptEditIncome() {
    const incomeConfig = StorageManager.getIncomeConfig();
    const baseStr = prompt('Ingreso Base Mensual ($):', incomeConfig.baseIncome);
    if (baseStr === null) return;
    const extraStr = prompt('Ingresos Extras del Mes ($):', incomeConfig.extraIncome);
    if (extraStr === null) return;

    const base = Number(baseStr) || 0;
    const extra = Number(extraStr) || 0;

    StorageManager.saveIncomeConfig({ baseIncome: base, extraIncome: extra });
    this.refreshCurrentView();
    this.showToast('Ingresos actualizados correctamente.');
  }

  static promptEditFixedAmount(id) {
    const fixed = StorageManager.getFixedExpenses(this.selectedMonth);
    const item = fixed.find(f => f.id === id);
    if (!item) return;

    const newAmountStr = prompt(`Modificar monto para "${item.concept}" en este mes:`, item.amount);
    if (newAmountStr === null) return;
    const newAmount = Number(newAmountStr);
    if (isNaN(newAmount) || newAmount < 0) {
      alert('Monto inválido.');
      return;
    }

    item.amount = newAmount;
    StorageManager.saveFixedExpenses(fixed, this.selectedMonth);
    this.refreshCurrentView();
    this.showToast(`Monto de ${item.concept} actualizado a $${newAmount.toLocaleString()}`);
  }

  static toggleFixedPaid(id) {
    const fixed = StorageManager.getFixedExpenses(this.selectedMonth);
    const item = fixed.find(f => f.id === id);
    if (item) {
      item.isPaid = !item.isPaid;
      StorageManager.saveFixedExpenses(fixed, this.selectedMonth);
      this.refreshCurrentView();
      this.showToast(`${item.concept} marcado como ${item.isPaid ? 'Pagado ✓' : 'Pendiente'}`);
    }
  }

  static deleteFixedExpense(id) {
    if (confirm('¿Eliminar este concepto de gastos fijos para este mes?')) {
      let fixed = StorageManager.getFixedExpenses(this.selectedMonth);
      fixed = fixed.filter(f => f.id !== id);
      StorageManager.saveFixedExpenses(fixed, this.selectedMonth);
      this.refreshCurrentView();
      this.showToast('Concepto eliminado');
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

  static deleteDebt(id) {
    if (confirm('¿Eliminar esta deuda?')) {
      let debts = StorageManager.getDebts();
      debts = debts.filter(d => d.id !== id);
      StorageManager.saveDebts(debts);
      this.refreshCurrentView();
      this.showToast('Deuda eliminada');
    }
  }

  static deleteGoal(id) {
    if (confirm('¿Eliminar esta meta?')) {
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
    if (isNaN(amount) || amount <= 0) return;

    debt.remainingAmount = Math.max(0, debt.remainingAmount - amount);
    StorageManager.saveDebts(debts);
    this.refreshCurrentView();
    this.showToast(`Pago de $${amount.toLocaleString()} registrado con éxito.`);
  }

  static promptAddGoalContribution(goalId) {
    const goals = StorageManager.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const amountStr = prompt(`Aportar ahorro a la meta "${goal.name}"\nObjetivo: $${goal.targetAmount}\nAcumulado: $${goal.currentAmount}\nIngresa el monto:`);
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    goal.currentAmount = Number(goal.currentAmount || 0) + amount;
    StorageManager.saveGoals(goals);
    this.refreshCurrentView();
    this.showToast(`¡Aporte de $${amount.toLocaleString()} sumado a ${goal.name}!`);
  }

  static refreshCurrentView() {
    switch (this.currentTab) {
      case 'fixed_sheet': this.renderFixedSheet(); break;
      case 'dashboard': this.renderDashboard(); break;
      case 'transactions': this.renderTransactions(); break;
      case '503020': this.render503020View(); break;
      case '3steps': this.render3StepsView(); break;
      case 'settings': this.renderSettings(); break;
    }
  }

  static renderSettings() {
    const fbConfig = FirebaseConfigManager.getConfig();
    const apiKeyInput = document.getElementById('fb-api-key');
    const appIdInput = document.getElementById('fb-app-id');
    const authDomainInput = document.getElementById('fb-auth-domain');
    const projectIdInput = document.getElementById('fb-project-id');

    if (apiKeyInput) apiKeyInput.value = fbConfig.apiKey || '';
    if (appIdInput) appIdInput.value = fbConfig.appId || '';
    if (authDomainInput) authDomainInput.value = fbConfig.authDomain || 'presu-e7466.firebaseapp.com';
    if (projectIdInput) projectIdInput.value = fbConfig.projectId || 'presu-e7466';
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
