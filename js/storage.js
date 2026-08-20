/**
 * storage.js - Gestión de almacenamiento local multi-mes, persistencia y respaldo
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'finanzas360_transactions',
  FIXED_EXPENSES_BASE: 'finanzas360_fixed_expenses',
  INCOME_CONFIG: 'finanzas360_income_config',
  BILLS: 'finanzas360_bills',
  DEBTS: 'finanzas360_debts',
  GOALS: 'finanzas360_goals',
  CONFIG: 'finanzas360_config',
  THEME: 'finanzas360_theme',
  VERSION: 'finanzas360_data_version'
};

const DATA_VERSION = '2026.08.20.v4';

const DEFAULT_INCOME_CONFIG = {
  baseIncome: 4200000,
  extraIncome: 150000
};

const DEFAULT_CONFIG = {
  currency: 'ARS',
  currencySymbol: '$',
  monthlyExpectedIncome: 4350000,
  emergencyFundMonths: 3,
  debtStrategy: 'snowball', // 'snowball' o 'avalanche'
};

// Gastos fijos predefinidos con tramos de pago: Tramo 1 (Día 1 / 19.5%) y Tramo 2 (Día 7-10 / 80.5%)
const DEFAULT_FIXED_EXPENSES = [
  { id: 'fix-1', concept: 'Alquiler', amount: 460000, isPaid: false, category: 'Vivienda', classification: 'need', tramo: 1 },
  { id: 'fix-2', concept: 'Tarjeta', amount: 534000, isPaid: false, category: 'Finanzas / Tarjetas', classification: 'need', tramo: 2 },
  { id: 'fix-3', concept: 'Agua', amount: 40000, isPaid: false, category: 'Servicios', classification: 'need', tramo: 1 },
  { id: 'fix-4', concept: 'Nafta', amount: 0, isPaid: false, category: 'Transporte', classification: 'need', tramo: 1 },
  { id: 'fix-5', concept: 'Patente', amount: 15000, isPaid: false, category: 'Impuestos / Vehículo', classification: 'need', tramo: 1 },
  { id: 'fix-6', concept: 'Luz', amount: 120000, isPaid: false, category: 'Servicios', classification: 'need', tramo: 2 },
  { id: 'fix-7', concept: 'Internet', amount: 65000, isPaid: false, category: 'Servicios', classification: 'need', tramo: 1 },
  { id: 'fix-8', concept: 'Celulares', amount: 40000, isPaid: false, category: 'Servicios', classification: 'need', tramo: 1 },
  { id: 'fix-9', concept: 'Gas', amount: 50000, isPaid: false, category: 'Servicios', classification: 'need', tramo: 1 },
  { id: 'fix-10', concept: 'Colegio Mati', amount: 155000, isPaid: false, category: 'Educación', classification: 'need', tramo: 2 },
  { id: 'fix-11', concept: 'Colegio Sol', amount: 280000, isPaid: false, category: 'Educación', classification: 'need', tramo: 2 },
  { id: 'fix-12', concept: 'Colegio Lola', amount: 150000, isPaid: false, category: 'Educación', classification: 'need', tramo: 2 },
  { id: 'fix-13', concept: 'Gimnasio', amount: 93000, isPaid: false, category: 'Salud / Bienestar', classification: 'want', tramo: 2 },
  { id: 'fix-14', concept: 'Mama Sueldo', amount: 200000, isPaid: false, category: 'Familia / Personal', classification: 'need', tramo: 2 },
  { id: 'fix-15', concept: 'Facu', amount: 680000, isPaid: false, category: 'Educación / Universidad', classification: 'need', tramo: 2 }
];

const SAMPLE_TRANSACTIONS = [
  {
    id: 'tx-1',
    date: new Date().toISOString().slice(0, 10),
    type: 'income',
    amount: 819000,
    category: 'Sueldo (Tramo 1 - 19.5%)',
    classification: 'income',
    paymentMethod: 'Transferencia',
    notes: 'Primer tramo de sueldo (Día 1)'
  },
  {
    id: 'tx-2',
    date: new Date().toISOString().slice(0, 7) + '-08',
    type: 'income',
    amount: 3381000,
    category: 'Sueldo (Tramo 2 - 80.5%)',
    classification: 'income',
    paymentMethod: 'Transferencia',
    notes: 'Segundo tramo principal de sueldo'
  }
];

const SAMPLE_DEBTS = [
  {
    id: 'debt-1',
    name: 'Resumen Tarjeta',
    totalAmount: 534000,
    remainingAmount: 534000,
    interestRate: 60.0,
    minimumPayment: 85000,
    notes: 'Gastos y compras en cuotas'
  }
];

const SAMPLE_GOALS = [
  {
    id: 'goal-1',
    name: 'Fondo de Emergencia (3 meses)',
    targetAmount: 5000000,
    currentAmount: 1650000,
    deadline: '2026-12-31',
    category: 'Seguridad',
    icon: 'shield-check'
  }
];

class StorageManager {
  static get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  }

  static notifyCloudSync() {
    if (typeof FirebaseService !== 'undefined' && FirebaseService.triggerAutoSync) {
      FirebaseService.triggerAutoSync();
    }
  }

  static getMonthKey(monthStr) {
    const validMonth = monthStr || new Date().toISOString().slice(0, 7);
    return `${STORAGE_KEYS.FIXED_EXPENSES_BASE}_${validMonth}`;
  }

  static initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      this.set(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INCOME_CONFIG)) {
      this.set(STORAGE_KEYS.INCOME_CONFIG, DEFAULT_INCOME_CONFIG);
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthKey = this.getMonthKey(currentMonth);

    // Inicializar mes actual si no existe
    if (!localStorage.getItem(monthKey)) {
      const legacy = this.get(STORAGE_KEYS.FIXED_EXPENSES_BASE, null);
      if (legacy && legacy.length > 0) {
        this.set(monthKey, legacy);
      } else {
        this.set(monthKey, DEFAULT_FIXED_EXPENSES);
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.set(STORAGE_KEYS.TRANSACTIONS, SAMPLE_TRANSACTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEBTS)) {
      this.set(STORAGE_KEYS.DEBTS, SAMPLE_DEBTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GOALS)) {
      this.set(STORAGE_KEYS.GOALS, SAMPLE_GOALS);
    }
  }

  /**
   * Obtiene los gastos fijos del mes seleccionado.
   * Si es un nuevo mes sin datos, clona los conceptos del mes anterior con 'isPaid: false'.
   */
  static getFixedExpenses(monthStr = null) {
    const targetMonth = monthStr || new Date().toISOString().slice(0, 7);
    const monthKey = this.getMonthKey(targetMonth);
    const data = this.get(monthKey, null);

    if (data && data.length > 0) {
      return data;
    }

    // Si no existe aún este mes, clonar la última planilla disponible con pagos reseteados a false
    const baseTemplate = this.get(STORAGE_KEYS.FIXED_EXPENSES_BASE, DEFAULT_FIXED_EXPENSES);
    const freshMonthData = baseTemplate.map(item => ({
      ...item,
      isPaid: false
    }));

    this.set(monthKey, freshMonthData);
    return freshMonthData;
  }

  /**
   * Guarda los gastos fijos para un mes específico
   */
  static saveFixedExpenses(expenses, monthStr = null) {
    const targetMonth = monthStr || new Date().toISOString().slice(0, 7);
    const monthKey = this.getMonthKey(targetMonth);
    this.set(monthKey, expenses);
    // Mantener también actualizado el template base general
    this.set(STORAGE_KEYS.FIXED_EXPENSES_BASE, expenses);
    this.notifyCloudSync();
  }

  /**
   * Reinicia únicamente el estado de 'Pagado' para el mes actual (útil al iniciar el mes)
   */
  static resetMonthPayments(monthStr) {
    const current = this.getFixedExpenses(monthStr);
    const reset = current.map(item => ({ ...item, isPaid: false }));
    this.saveFixedExpenses(reset, monthStr);
    return reset;
  }

  static getIncomeConfig() {
    return this.get(STORAGE_KEYS.INCOME_CONFIG, DEFAULT_INCOME_CONFIG);
  }

  static saveIncomeConfig(incomeConfig) {
    this.set(STORAGE_KEYS.INCOME_CONFIG, incomeConfig);
    this.notifyCloudSync();
  }

  static getTransactions() {
    return this.get(STORAGE_KEYS.TRANSACTIONS, []);
  }

  static saveTransactions(transactions) {
    this.set(STORAGE_KEYS.TRANSACTIONS, transactions);
    this.notifyCloudSync();
  }

  static getDebts() {
    return this.get(STORAGE_KEYS.DEBTS, []);
  }

  static saveDebts(debts) {
    this.set(STORAGE_KEYS.DEBTS, debts);
    this.notifyCloudSync();
  }

  static getGoals() {
    return this.get(STORAGE_KEYS.GOALS, []);
  }

  static saveGoals(goals) {
    this.set(STORAGE_KEYS.GOALS, goals);
    this.notifyCloudSync();
  }

  static getConfig() {
    return { ...DEFAULT_CONFIG, ...(this.get(STORAGE_KEYS.CONFIG, {})) };
  }

  static saveConfig(config) {
    this.set(STORAGE_KEYS.CONFIG, config);
    this.notifyCloudSync();
  }

  static getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  }

  static setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  static exportJSON() {
    const allKeys = Object.keys(localStorage);
    const allMonthsFixed = {};
    allKeys.forEach(k => {
      if (k.startsWith(`${STORAGE_KEYS.FIXED_EXPENSES_BASE}_`)) {
        const m = k.replace(`${STORAGE_KEYS.FIXED_EXPENSES_BASE}_`, '');
        allMonthsFixed[m] = this.get(k);
      }
    });

    const backup = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      config: this.getConfig(),
      incomeConfig: this.getIncomeConfig(),
      fixedExpensesBase: this.getFixedExpenses(),
      allMonthsFixed,
      transactions: this.getTransactions(),
      debts: this.getDebts(),
      goals: this.getGoals()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo-finanzas360-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.incomeConfig) this.saveIncomeConfig(parsed.incomeConfig);
      if (parsed.transactions) this.saveTransactions(parsed.transactions);
      if (parsed.debts) this.saveDebts(parsed.debts);
      if (parsed.goals) this.saveGoals(parsed.goals);
      if (parsed.config) this.saveConfig(parsed.config);
      if (parsed.allMonthsFixed) {
        Object.keys(parsed.allMonthsFixed).forEach(m => {
          this.set(this.getMonthKey(m), parsed.allMonthsFixed[m]);
        });
      } else if (parsed.fixedExpenses) {
        this.saveFixedExpenses(parsed.fixedExpenses);
      }
      return true;
    } catch (e) {
      console.error('Error importing backup:', e);
      return false;
    }
  }

  static exportCSV(monthFilter = null) {
    const fixed = this.getFixedExpenses(monthFilter);
    const headers = ['ID', 'Concepto', 'Monto', 'Pagado', 'Tramo', 'Categoría', 'Clasificación'];
    const rows = fixed.map(f => [
      `"${f.id}"`,
      `"${f.concept}"`,
      f.amount,
      f.isPaid ? 'SI' : 'NO',
      f.tramo === 1 ? 'Tramo 1 (Día 1)' : 'Tramo 2 (Día 7-10)',
      `"${f.category || ''}"`,
      `"${f.classification || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gastos-fijos-${monthFilter || 'mensual'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  static resetToSampleData() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    this.set(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    this.set(STORAGE_KEYS.INCOME_CONFIG, DEFAULT_INCOME_CONFIG);
    this.set(STORAGE_KEYS.FIXED_EXPENSES_BASE, DEFAULT_FIXED_EXPENSES);
    this.set(this.getMonthKey(currentMonth), DEFAULT_FIXED_EXPENSES);
    this.set(STORAGE_KEYS.TRANSACTIONS, SAMPLE_TRANSACTIONS);
    this.set(STORAGE_KEYS.DEBTS, SAMPLE_DEBTS);
    this.set(STORAGE_KEYS.GOALS, SAMPLE_GOALS);
    this.notifyCloudSync();
  }

  static clearAllData() {
    this.set(STORAGE_KEYS.FIXED_EXPENSES_BASE, []);
    const currentMonth = new Date().toISOString().slice(0, 7);
    this.set(this.getMonthKey(currentMonth), []);
    this.set(STORAGE_KEYS.TRANSACTIONS, []);
    this.set(STORAGE_KEYS.DEBTS, []);
    this.set(STORAGE_KEYS.GOALS, []);
    this.notifyCloudSync();
  }
}
