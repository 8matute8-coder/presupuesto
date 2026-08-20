/**
 * finance-logic.js - Algoritmos de cálculo financiero adaptados a la planilla del usuario
 */

class FinanceLogic {
  /**
   * Resumen y cálculo de la Planilla de Gastos Fijos (según el Excel del usuario)
   */
  static getFixedExpensesSummary(fixedExpenses = [], incomeConfig = { baseIncome: 4200000, extraIncome: 150000 }) {
    const baseIncome = Number(incomeConfig.baseIncome) || 0;
    const extraIncome = Number(incomeConfig.extraIncome) || 0;
    const totalIncome = baseIncome + extraIncome;

    let totalFixed = 0;
    let totalPaid = 0;
    let totalPending = 0;

    fixedExpenses.forEach(item => {
      const amount = Number(item.amount) || 0;
      totalFixed += amount;
      if (item.isPaid) {
        totalPaid += amount;
      } else {
        totalPending += amount;
      }
    });

    const fixedPercentageOfIncome = totalIncome > 0 ? (totalFixed / totalIncome) * 100 : 0;
    const netRemainder = totalIncome - totalFixed;

    // Cálculo de días del mes actual y días restantes
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = Math.max(1, daysInCurrentMonth - currentDay + 1);

    // Promedio gasto diario (base mes completo, ej. 31 días)
    const dailyAverageMonth = daysInCurrentMonth > 0 ? netRemainder / daysInCurrentMonth : 0;
    // Promedio gasto diario disponible para los días restantes
    const dailyAverageRemainingDays = netRemainder / daysRemaining;

    // Enriquecer cada ítem con sus porcentajes calculados
    const enrichedExpenses = fixedExpenses.map(item => {
      const amount = Number(item.amount) || 0;
      const pctOfIncome = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
      const pctOfFixed = totalFixed > 0 ? (amount / totalFixed) * 100 : 0;
      return {
        ...item,
        amount,
        pctOfIncome,
        pctOfFixed
      };
    });

    return {
      baseIncome,
      extraIncome,
      totalIncome,
      totalFixed,
      totalPaid,
      totalPending,
      fixedPercentageOfIncome,
      netRemainder,
      daysInCurrentMonth,
      currentDay,
      daysRemaining,
      dailyAverageMonth,
      dailyAverageRemainingDays,
      items: enrichedExpenses
    };
  }

  /**
   * Resumen de movimientos de ingresos, gastos y balance por mes
   */
  static getMonthSummary(transactions, monthStr, fixedExpenses = [], incomeConfig = { baseIncome: 4200000, extraIncome: 150000 }) {
    const monthTx = transactions.filter(t => t.date.startsWith(monthStr));
    
    let totalIncome = 0;
    let totalExpenses = 0;
    let needsSpent = 0;
    let wantsSpent = 0;
    let savingsSpent = 0;

    const categoryBreakdown = {};

    // Sumar transacciones reales
    monthTx.forEach(t => {
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
        if (t.classification === 'need') needsSpent += amount;
        else if (t.classification === 'want') wantsSpent += amount;
        else if (t.classification === 'savings') savingsSpent += amount;
        else needsSpent += amount;

        const cat = t.category || 'Otros';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amount;
      }
    });

    // Si en el mes no se cargaron ingresos explícitos, tomamos los configurados en la planilla
    if (totalIncome === 0) {
      totalIncome = (Number(incomeConfig.baseIncome) || 0) + (Number(incomeConfig.extraIncome) || 0);
    }

    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savingsSpent / totalIncome) * 100 : 0;

    return {
      monthStr,
      totalIncome,
      totalExpenses,
      netBalance,
      needsSpent,
      wantsSpent,
      savingsSpent,
      savingsRate,
      categoryBreakdown,
      transactionCount: monthTx.length
    };
  }

  /**
   * Regla 50/30/20 (BBVA)
   */
  static calculate503020(summary, fixedSummary) {
    const baseIncome = summary.totalIncome > 0 ? summary.totalIncome : fixedSummary.totalIncome;

    const targetNeeds = baseIncome * 0.50;
    const targetWants = baseIncome * 0.30;
    const targetSavings = baseIncome * 0.20;

    const actualNeedsPct = baseIncome > 0 ? (summary.needsSpent / baseIncome) * 100 : 0;
    const actualWantsPct = baseIncome > 0 ? (summary.wantsSpent / baseIncome) * 100 : 0;
    const actualSavingsPct = baseIncome > 0 ? (summary.savingsSpent / baseIncome) * 100 : 0;

    const getStatus = (spent, target) => {
      if (target <= 0) return { status: 'neutral', label: 'Sin presupuesto', color: 'gray' };
      const ratio = spent / target;
      if (ratio <= 0.85) return { status: 'good', label: 'Óptimo', color: 'emerald' };
      if (ratio <= 1.0) return { status: 'warning', label: 'Cerca del límite', color: 'amber' };
      return { status: 'danger', label: 'Excedido', color: 'rose' };
    };

    const getSavingsStatus = (spent, target) => {
      if (target <= 0) return { status: 'neutral', label: 'Sin presupuesto', color: 'gray' };
      const ratio = spent / target;
      if (ratio >= 1.0) return { status: 'good', label: 'Meta alcanzada', color: 'emerald' };
      if (ratio >= 0.6) return { status: 'warning', label: 'En progreso', color: 'amber' };
      return { status: 'danger', label: 'Bajo ahorro', color: 'rose' };
    };

    return {
      baseIncome,
      needs: {
        target: targetNeeds,
        spent: summary.needsSpent,
        remaining: targetNeeds - summary.needsSpent,
        percentOfIncome: actualNeedsPct,
        targetPercent: 50,
        progressPercent: targetNeeds > 0 ? Math.min((summary.needsSpent / targetNeeds) * 100, 100) : 0,
        ...getStatus(summary.needsSpent, targetNeeds)
      },
      wants: {
        target: targetWants,
        spent: summary.wantsSpent,
        remaining: targetWants - summary.wantsSpent,
        percentOfIncome: actualWantsPct,
        targetPercent: 30,
        progressPercent: targetWants > 0 ? Math.min((summary.wantsSpent / targetWants) * 100, 100) : 0,
        ...getStatus(summary.wantsSpent, targetWants)
      },
      savings: {
        target: targetSavings,
        spent: summary.savingsSpent,
        remaining: targetSavings - summary.savingsSpent,
        percentOfIncome: actualSavingsPct,
        targetPercent: 20,
        progressPercent: targetSavings > 0 ? Math.min((summary.savingsSpent / targetSavings) * 100, 100) : 0,
        ...getSavingsStatus(summary.savingsSpent, targetSavings)
      }
    };
  }

  /**
   * Diagnóstico y Score de Salud Financiera (0 a 100)
   */
  static calculateHealthScore(summary, budget503020, debts, fixedSummary) {
    let score = 0;
    const tips = [];

    // 1. Balance general (hasta 25 puntos)
    if (summary.netBalance >= 0) {
      score += 25;
    } else {
      const deficitRatio = Math.abs(summary.netBalance) / (summary.totalIncome || 1);
      score += Math.max(0, Math.round(25 * (1 - deficitRatio)));
      tips.push({
        type: 'danger',
        text: 'Tus gastos superan tus ingresos del mes. Revisa gastos prescindibles para volver a un balance positivo.'
      });
    }

    // 2. Control de Gastos Fijos (hasta 25 puntos)
    if (fixedSummary.fixedPercentageOfIncome <= 55) {
      score += 25;
    } else if (fixedSummary.fixedPercentageOfIncome <= 65) {
      score += 18;
      tips.push({
        type: 'info',
        text: `Tus gastos fijos representan el ${fixedSummary.fixedPercentageOfIncome.toFixed(1)}% de tus ingresos. Para cumplir el 50/30/20 estricto, adapta los gastos variables y cuida el disponible diario de ${UIManager.formatCurrency(fixedSummary.dailyAverageMonth)}/día.`
      });
    } else {
      score += 10;
      tips.push({
        type: 'warning',
        text: `Tus gastos fijos comprometen el ${fixedSummary.fixedPercentageOfIncome.toFixed(1)}% de tus ingresos. Revisa servicios o cuotas para recuperar margen de ahorro.`
      });
    }

    // 3. Control de deudas (hasta 25 puntos)
    const totalDebt = debts.reduce((sum, d) => sum + Number(d.remainingAmount || 0), 0);
    if (debts.length === 0 || totalDebt === 0) {
      score += 25;
    } else {
      score += 18;
      tips.push({
        type: 'info',
        text: 'Mantén al día el resumen de la tarjeta para no devengar intereses rotativos.'
      });
    }

    // 4. Cumplimiento de pagos de la planilla (hasta 25 puntos)
    const pendingCount = fixedSummary.items.filter(i => !i.isPaid && i.amount > 0).length;
    if (pendingCount === 0) {
      score += 25;
    } else {
      score += 20;
    }

    score = Math.min(100, Math.max(0, score));

    let level = 'Excelente';
    let color = 'emerald';
    if (score >= 85) { level = 'Excelente'; color = 'emerald'; }
    else if (score >= 70) { level = 'Bueno'; color = 'blue'; }
    else if (score >= 50) { level = 'Regular'; color = 'amber'; }
    else { level = 'Atención'; color = 'rose'; }

    return {
      score,
      level,
      color,
      tips
    };
  }

  static getDebtStrategies(debts) {
    if (!debts || debts.length === 0) return { snowball: [], avalanche: [], totalDebt: 0, totalMinPayment: 0 };
    const validDebts = debts.map(d => ({
      ...d,
      remainingAmount: Number(d.remainingAmount) || 0,
      interestRate: Number(d.interestRate) || 0,
      minimumPayment: Number(d.minimumPayment) || 0
    }));

    const totalDebt = validDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const totalMinPayment = validDebts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const snowball = [...validDebts].sort((a, b) => a.remainingAmount - b.remainingAmount);
    const avalanche = [...validDebts].sort((a, b) => b.interestRate - a.interestRate);

    return { snowball, avalanche, totalDebt, totalMinPayment };
  }

  static calculateGoalPacing(goal) {
    const target = Number(goal.targetAmount) || 0;
    const current = Number(goal.currentAmount) || 0;
    const remaining = Math.max(0, target - current);
    const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

    let monthsLeft = 1;
    let suggestedMonthly = remaining;

    if (goal.deadline) {
      const now = new Date();
      const end = new Date(goal.deadline);
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      monthsLeft = Math.max(1, Math.ceil(diffDays / 30));
      suggestedMonthly = remaining / monthsLeft;
    }

    return { ...goal, remaining, progress, monthsLeft, suggestedMonthly };
  }
}
