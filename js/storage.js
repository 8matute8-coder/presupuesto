/**
 * storage.js - Gestión de almacenamiento local (localStorage) y respaldo de datos
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'finanzas360_transactions',
  FIXED_EXPENSES: 'finanzas360_fixed_expenses',
  INCOME_CONFIG: 'finanzas360_income_config',
  BILLS: 'finanzas360_bills',
  DEBTS: 'finanzas360_debts',
  GOALS: 'finanzas360_goals',
  CONFIG: 'finanzas360_config',
  THEME: 'finanzas360_theme'
};

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

// Gastos fijos predefinidos según planilla del usuario (100% editables)
const DEFAULT_FIXED_EXPENSES = [
  { id: 'fix-1', concept: 'Alquiler', amount: 460000, isPaid: false, category: 'Vivienda', classification: 'need' },
  { id: 'fix-2', concept: 'Tarjeta', amount: 534000, isPaid: false, category: 'Finanzas / Tarjetas', classification: 'need' },
  { id: 'fix-3', concept: 'Agua', amount: 0, isPaid: false, category: 'Servicios', classification: 'need' },
  { id: 'fix-4', concept: 'Nafta', amount: 0, isPaid: false, category: 'Transporte', classification: 'need' },
  { id: 'fix-5', concept: 'Patente', amount: 15000, isPaid: false, category: 'Impuestos / Vehículo', classification: 'need' },
  { id: 'fix-6', concept: 'Luz', amount: 0, isPaid: false, category: 'Servicios', classification: 'need' },
  { id: 'fix-7', concept: 'Internet', amount: 62000, isPaid: false, category: 'Servicios', classification: 'need' },
  { id: 'fix-8', concept: 'Celulares', amount: 30000, isPaid: false, category: 'Servicios', classification: 'need' },
  { id: 'fix-9', concept: 'Gasnor', amount: 40000, isPaid: false, category: 'Servicios', classification: 'need' },
  { id: 'fix-10', concept: 'Colegio Mati', amount: 155000, isPaid: false, category: 'Educación', classification: 'need' },
  { id: 'fix-11', concept: 'Colegio Sol', amount: 280000, isPaid: false, category: 'Educación', classification: 'need' },
  { id: 'fix-12', concept: 'Colegio Lola', amount: 150000, isPaid: false, category: 'Educación', classification: 'need' },
  { id: 'fix-13', concept: 'Gimnasio', amount: 93000, isPaid: false, category: 'Salud / Bienestar', classification: 'want' },
  { id: 'fix-14', concept: 'Mama Sueldo', amount: 200000, isPaid: false, category: 'Familia / Personal', classification: 'need' },
  { id: 'fix-15', concept: 'Facu', amount: 680000, isPaid: false, category: 'Educación / Universidad', classification: 'need' }
];

const SAMPLE_TRANSACTIONS = [
  {
    id: 'tx-1',
    date: new Date().toISOString().slice(0, 10),
    type: 'income',
    amount: 4200000,
    category: 'Salario / Sueldo',
    classification: 'income',
    paymentMethod: 'Transferencia',
    notes: 'Ingreso mensual base'
  },
  {
    id: 'tx-2',
    date: new Date().toISOString().slice(0, 10),
    type: 'income',
    amount: 150000,
    category: 'Otros Ingresos',
    classification: 'income',
    paymentMethod: 'Transferencia',
    notes: 'Ingreso extra del mes'
  },
  {
    id: 'tx-3',
    date: new Date(new Date().setDate(2)).toISOString().slice(0, 10),
    type: 'expense',
    amount: 460000,
    category: 'Alquiler',
    classification: 'need',
    paymentMethod: 'Transferencia',
    notes: 'Alquiler mensual'
  },
  {
    id: 'tx-4',
    date: new Date(new Date().setDate(5)).toISOString().slice(0, 10),
    type: 'expense',
    amount: 534000,
    category: 'Tarjeta',
    classification: 'need',
    paymentMethod: 'Débito',
    notes: 'Resumen mensual de tarjeta'
  },
  {
    id: 'tx-5',
    date: new Date(new Date().setDate(7)).toISOString().slice(0, 10),
    type: 'expense',
    amount: 680000,
    category: 'Facu',
    classification: 'need',
    paymentMethod: 'Transferencia',
    notes: 'Cuota universidad Facu'
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
  },
  {
    id: 'goal-2',
    name: 'Vacaciones Familiares',
    targetAmount: 2000000,
    currentAmount: 600000,
    deadline: '2027-01-15',
    category: 'Viajes',
    icon: 'plane'
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

  static initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      this.set(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INCOME_CONFIG)) {
      this.set(STORAGE_KEYS.INCOME_CONFIG, DEFAULT_INCOME_CONFIG);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FIXED_EXPENSES)) {
      this.set(STORAGE_KEYS.FIXED_EXPENSES, DEFAULT_FIXED_EXPENSES);
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

  static getFixedExpenses() {
    return this.get(STORAGE_KEYS.FIXED_EXPENSES, DEFAULT_FIXED_EXPENSES);
  }

  static saveFixedExpenses(expenses) {
    this.set(STORAGE_KEYS.FIXED_EXPENSES, expenses);
  }

  static getIncomeConfig() {
    return this.get(STORAGE_KEYS.INCOME_CONFIG, DEFAULT_INCOME_CONFIG);
  }

  static saveIncomeConfig(incomeConfig) {
    this.set(STORAGE_KEYS.INCOME_CONFIG, incomeConfig);
  }

  static getTransactions() {
    return this.get(STORAGE_KEYS.TRANSACTIONS, []);
  }

  static saveTransactions(transactions) {
    this.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  static getDebts() {
    return this.get(STORAGE_KEYS.DEBTS, []);
  }

  static saveDebts(debts) {
    this.set(STORAGE_KEYS.DEBTS, debts);
  }

  static getGoals() {
    return this.get(STORAGE_KEYS.GOALS, []);
  }

  static saveGoals(goals) {
    this.set(STORAGE_KEYS.GOALS, goals);
  }

  static getConfig() {
    return { ...DEFAULT_CONFIG, ...(this.get(STORAGE_KEYS.CONFIG, {})) };
  }

  static saveConfig(config) {
    this.set(STORAGE_KEYS.CONFIG, config);
  }

  static getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  }

  static setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  static exportJSON() {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      config: this.getConfig(),
      incomeConfig: this.getIncomeConfig(),
      fixedExpenses: this.getFixedExpenses(),
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
      if (parsed.fixedExpenses) this.saveFixedExpenses(parsed.fixedExpenses);
      if (parsed.incomeConfig) this.saveIncomeConfig(parsed.incomeConfig);
      if (parsed.transactions) this.saveTransactions(parsed.transactions);
      if (parsed.debts) this.saveDebts(parsed.debts);
      if (parsed.goals) this.saveGoals(parsed.goals);
      if (parsed.config) this.saveConfig(parsed.config);
      return true;
    } catch (e) {
      console.error('Error importing backup:', e);
      return false;
    }
  }

  static exportCSV(monthFilter = null) {
    const fixed = this.getFixedExpenses();
    const headers = ['ID', 'Concepto', 'Monto', 'Pagado', 'Categoría', 'Clasificación'];
    const rows = fixed.map(f => [
      `"${f.id}"`,
      `"${f.concept}"`,
      f.amount,
      f.isPaid ? 'SI' : 'NO',
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
    this.set(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    this.set(STORAGE_KEYS.INCOME_CONFIG, DEFAULT_INCOME_CONFIG);
    this.set(STORAGE_KEYS.FIXED_EXPENSES, DEFAULT_FIXED_EXPENSES);
    this.set(STORAGE_KEYS.TRANSACTIONS, SAMPLE_TRANSACTIONS);
    this.set(STORAGE_KEYS.DEBTS, SAMPLE_DEBTS);
    this.set(STORAGE_KEYS.GOALS, SAMPLE_GOALS);
  }

  static clearAllData() {
    this.set(STORAGE_KEYS.FIXED_EXPENSES, []);
    this.set(STORAGE_KEYS.TRANSACTIONS, []);
    this.set(STORAGE_KEYS.DEBTS, []);
    this.set(STORAGE_KEYS.GOALS, []);
  }
}
