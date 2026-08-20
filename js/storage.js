/**
 * storage.js - Gestión de almacenamiento local (localStorage) y respaldo de datos
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'finanzas360_transactions',
  BILLS: 'finanzas360_bills',
  DEBTS: 'finanzas360_debts',
  GOALS: 'finanzas360_goals',
  CONFIG: 'finanzas360_config',
  THEME: 'finanzas360_theme'
};

const DEFAULT_CONFIG = {
  currency: 'ARS',
  currencySymbol: '$',
  monthlyExpectedIncome: 650000,
  emergencyFundMonths: 3,
  debtStrategy: 'snowball', // 'snowball' (menor saldo) o 'avalanche' (mayor tasa)
};

const SAMPLE_TRANSACTIONS = [
  // Ingresos del mes actual
  {
    id: 'tx-1',
    date: new Date().toISOString().slice(0, 10),
    type: 'income',
    amount: 650000,
    category: 'Salario / Sueldo',
    classification: 'income',
    paymentMethod: 'Transferencia',
    notes: 'Sueldo mensual neto'
  },
  // Necesidades (50%)
  {
    id: 'tx-2',
    date: new Date(new Date().setDate(2)).toISOString().slice(0, 10),
    type: 'expense',
    amount: 180000,
    category: 'Vivienda / Alquiler',
    classification: 'need',
    paymentMethod: 'Transferencia',
    notes: 'Alquiler departamento'
  },
  {
    id: 'tx-3',
    date: new Date(new Date().setDate(5)).toISOString().slice(0, 10),
    type: 'expense',
    amount: 28000,
    category: 'Servicios (Luz, Gas, Internet)',
    classification: 'need',
    paymentMethod: 'Débito',
    notes: 'Internet fibra óptica y luz'
  },
  {
    id: 'tx-4',
    date: new Date(new Date().setDate(8)).toISOString().slice(0, 10),
    type: 'expense',
    amount: 75000,
    category: 'Supermercado & Alimentación',
    classification: 'need',
    paymentMethod: 'Débito',
    notes: 'Compra mensual de alimentos'
  },
  {
    id: 'tx-5',
    date: new Date(new Date().setDate(12)).toISOString().slice(0, 10),
    type: 'expense',
    amount: 22000,
    category: 'Transporte & Combustible',
    classification: 'need',
    paymentMethod: 'Efectivo',
    notes: 'Carga de combustible y tarjeta de transporte'
  },
  // Deseos (30%)
  {
    id: 'tx-6',
    date: new Date(new Date().setDate(9)).toISOString().slice(0, 10),
    type: 'expense',
    amount: 32000,
    category: 'Salidas & Restaurantes',
    classification: 'want',
    paymentMethod: 'Tarjeta de Crédito',
    notes: 'Cena con amigos fin de semana'
  },
  {
    id: 'tx-7',
    date: new Date(new Date().setDate(10)).toISOString().slice(0, 10),
    type: 'expense',
    amount: 8500,
    category: 'Streaming & Suscripciones',
    classification: 'want',
    paymentMethod: 'Tarjeta de Crédito',
    notes: 'Netflix y Spotify'
  },
  {
    id: 'tx-8',
    date: new Date(new Date().setDate(14)).toISOString().slice(0, 10),
    type: 'expense',
    amount: 25000,
    category: 'Compras & Caprichos',
    classification: 'want',
    paymentMethod: 'Débito',
    notes: 'Ropa / Calzado de temporada'
  },
  // Ahorro e Inversión / Deuda (20%)
  {
    id: 'tx-9',
    date: new Date(new Date().setDate(3)).toISOString().slice(0, 10),
    type: 'expense',
    amount: 70000,
    category: 'Ahorro / Fondo Emergencia',
    classification: 'savings',
    paymentMethod: 'Transferencia',
    notes: 'Págate a ti primero - Fondo de reserva'
  },
  {
    id: 'tx-10',
    date: new Date(new Date().setDate(4)).toISOString().slice(0, 10),
    type: 'expense',
    amount: 45000,
    category: 'Pago de Deudas',
    classification: 'savings',
    paymentMethod: 'Transferencia',
    notes: 'Cuota préstamo personal'
  }
];

const SAMPLE_BILLS = [
  {
    id: 'bill-1',
    name: 'Alquiler del Hogar',
    amount: 180000,
    dueDay: 5,
    category: 'Vivienda',
    isPaid: true,
    autoPay: true
  },
  {
    id: 'bill-2',
    name: 'Servicio de Internet & TV',
    amount: 18500,
    dueDay: 10,
    category: 'Servicios',
    isPaid: true,
    autoPay: true
  },
  {
    id: 'bill-3',
    name: 'Resumen Tarjeta de Crédito',
    amount: 68000,
    dueDay: 22,
    category: 'Finanzas',
    isPaid: false,
    autoPay: false
  },
  {
    id: 'bill-4',
    name: 'Seguro Automotor / Médico',
    amount: 31000,
    dueDay: 28,
    category: 'Seguros',
    isPaid: false,
    autoPay: true
  }
];

const SAMPLE_DEBTS = [
  {
    id: 'debt-1',
    name: 'Tarjeta de Crédito Banco',
    totalAmount: 150000,
    remainingAmount: 95000,
    interestRate: 65.0, // TEA estimada %
    minimumPayment: 18000,
    notes: 'Consumos en cuotas anteriores'
  },
  {
    id: 'debt-2',
    name: 'Préstamo Personal',
    totalAmount: 300000,
    remainingAmount: 180000,
    interestRate: 48.5,
    minimumPayment: 32000,
    notes: 'Refacción del hogar (6 cuotas restantes)'
  }
];

const SAMPLE_GOALS = [
  {
    id: 'goal-1',
    name: 'Fondo de Emergencia (3 meses)',
    targetAmount: 900000,
    currentAmount: 450000,
    deadline: '2026-12-31',
    category: 'Seguridad',
    icon: 'shield-check'
  },
  {
    id: 'goal-2',
    name: 'Vacaciones de Verano',
    targetAmount: 500000,
    currentAmount: 200000,
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
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.set(STORAGE_KEYS.TRANSACTIONS, SAMPLE_TRANSACTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BILLS)) {
      this.set(STORAGE_KEYS.BILLS, SAMPLE_BILLS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEBTS)) {
      this.set(STORAGE_KEYS.DEBTS, SAMPLE_DEBTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GOALS)) {
      this.set(STORAGE_KEYS.GOALS, SAMPLE_GOALS);
    }
  }

  static getTransactions() {
    return this.get(STORAGE_KEYS.TRANSACTIONS, []);
  }

  static saveTransactions(transactions) {
    this.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  static getBills() {
    return this.get(STORAGE_KEYS.BILLS, []);
  }

  static saveBills(bills) {
    this.set(STORAGE_KEYS.BILLS, bills);
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
      version: '1.0',
      exportedAt: new Date().toISOString(),
      config: this.getConfig(),
      transactions: this.getTransactions(),
      bills: this.getBills(),
      debts: this.getDebts(),
      goals: this.getGoals()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo-finanzas-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.transactions) this.saveTransactions(parsed.transactions);
      if (parsed.bills) this.saveBills(parsed.bills);
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
    const transactions = this.getTransactions().filter(tx => {
      if (!monthFilter) return true;
      return tx.date.startsWith(monthFilter);
    });

    if (transactions.length === 0) return false;

    const headers = ['ID', 'Fecha', 'Tipo', 'Monto', 'Categoría', 'Clasificación 50/30/20', 'Medio de Pago', 'Notas'];
    const rows = transactions.map(t => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.type === 'income' ? 'Ingreso' : 'Gasto'}"`,
      t.amount,
      `"${t.category || ''}"`,
      `"${t.classification || ''}"`,
      `"${t.paymentMethod || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-gastos-${monthFilter || 'completo'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  static resetToSampleData() {
    this.set(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    this.set(STORAGE_KEYS.TRANSACTIONS, SAMPLE_TRANSACTIONS);
    this.set(STORAGE_KEYS.BILLS, SAMPLE_BILLS);
    this.set(STORAGE_KEYS.DEBTS, SAMPLE_DEBTS);
    this.set(STORAGE_KEYS.GOALS, SAMPLE_GOALS);
  }

  static clearAllData() {
    this.set(STORAGE_KEYS.TRANSACTIONS, []);
    this.set(STORAGE_KEYS.BILLS, []);
    this.set(STORAGE_KEYS.DEBTS, []);
    this.set(STORAGE_KEYS.GOALS, []);
  }
}
