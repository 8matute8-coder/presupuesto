/**
 * finance-logic.js - Algoritmos de cálculo financiero adaptados a la planilla del usuario
 * Incluye gestión de meses históricos y cash flow en 2 tramos de sueldo (19.5% y 80.5%)
 */

class FinanceLogic {
  /**
   * Resumen y cálculo de la Planilla de Gastos Fijos (según el Excel del usuario)
   */
  static getFixedExpensesSummary(fixedExpenses = [], incomeConfig = { baseIncome: 4200000, extraIncome: 150000 }, monthStr = null) {
    const baseIncome = Number(incomeConfig.baseIncome) || 0;
    const extraIncome = Number(incomeConfig.extraIncome) || 0;
    const totalIncome = baseIncome + extraIncome;

    let totalFixed = 0;
    let totalPaid = 0;
    let totalPending = 0;

    let tramo1Expenses = 0;
    let tramo2Expenses = 0;
    let tramo1Paid = 0;
    let tramo2Paid = 0;

    fixedExpenses.forEach(item => {
      const amount = Number(item.amount) || 0;
      totalFixed += amount;
      
      const tramo = item.tramo || 1;
      if (tramo === 1) {
        tramo1Expenses += amount;
        if (item.isPaid) tramo1Paid += amount;
      } else {
        tramo2Expenses += amount;
        if (item.isPaid) tramo2Paid += amount;
      }

      if (item.isPaid) {
        totalPaid += amount;
      } else {
        totalPending += amount;
      }
    });

    const fixedPercentageOfIncome = totalIncome > 0 ? (totalFixed / totalIncome) * 100 : 0;
    const netRemainder = totalIncome - totalFixed;

    // Cálculo de Tramos de Cobro (19.5% día 1 / fin de mes, 80.5% día 7-10)
    const tramo1Pct = 19.5;
    const tramo2Pct = 80.5;
    const tramo1Income = (baseIncome * (tramo1Pct / 100));
    const tramo2Income = (baseIncome * (tramo2Pct / 100)) + extraIncome;

    const tramo1Remainder = tramo1Income - tramo1Expenses;
    const tramo2Remainder = tramo2Income - tramo2Expenses;

    // Días del mes
    let targetDate = new Date();
    if (monthStr) {
      const [year, month] = monthStr.split('-').map(Number);
      if (year && month) targetDate = new Date(year, month - 1, 1);
    }
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const now = new Date();
    const isCurrentMonth = (now.getFullYear() === year && now.getMonth() === month);
    const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;
    const daysRemaining = isCurrentMonth ? Math.max(1, daysInMonth - currentDay + 1) : 1;

    const dailyAverageMonth = daysInMonth > 0 ? netRemainder / daysInMonth : 0;
    const dailyAverageRemainingDays = netRemainder / daysRemaining;

    // Enriquecer ítems
    const enrichedExpenses = fixedExpenses.map(item => {
      const amount = Number(item.amount) || 0;
      const pctOfIncome = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
      const pctOfFixed = totalFixed > 0 ? (amount / totalFixed) * 100 : 0;
      return {
        ...item,
        amount,
        tramo: item.tramo || (['Alquiler', 'Internet', 'Celulares', 'Agua', 'Gas', 'Patente'].includes(item.concept) ? 1 : 2),
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
      daysInCurrentMonth: daysInMonth,
      currentDay,
      daysRemaining,
      dailyAverageMonth,
      dailyAverageRemainingDays,
      // Datos de Tramos de Sueldo (19.5% y 80.5%)
      cashFlow: {
        tramo1: {
          name: 'Tramo 1 (Fin de Mes / Día 1)',
          pct: tramo1Pct,
          income: tramo1Income,
          expenses: tramo1Expenses,
          paid: tramo1Paid,
          remainder: tramo1Remainder,
          status: tramo1Remainder >= 0 ? 'Cubierto' : 'Déficit'
        },
        tramo2: {
          name: 'Tramo 2 (Día 7 al 10)',
          pct: tramo2Pct,
          income: tramo2Income,
          expenses: tramo2Expenses,
          paid: tramo2Paid,
          remainder: tramo2Remainder,
          status: tramo2Remainder >= 0 ? 'Cubierto' : 'Déficit'
        }
      },
      items: enrichedExpenses
    };
  }

  /**
   * Resumen de movimientos de ingresos, gastos y balance por mes
   */
  static getMonthSummary(transactions, monthStr, fixedExpenses = [], incomeConfig = { baseIncome: 4200000, extraIncome: 150000 }) {
    const monthTx = transactions.filter(t => t.date.startsWith(monthStr));
    
    let totalIncome = Number(incomeConfig.baseIncome) + Number(incomeConfig.extraIncome);
    let variableExpenses = 0;
    let needsExpenses = 0;
    let wantsExpenses = 0;
    let savingsExpenses = 0;

    // Sumar gastos fijos del mes
    fixedExpenses.forEach(f => {
      const amt = Number(f.amount) || 0;
      if (f.classification === 'want') {
        wantsExpenses += amt;
      } else if (f.classification === 'savings') {
        savingsExpenses += amt;
      } else {
        needsExpenses += amt;
      }
    });

    // Sumar movimientos variables registrados
    monthTx.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'expense') {
        variableExpenses += amt;
        if (t.classification === 'want') {
          wantsExpenses += amt;
        } else if (t.classification === 'savings') {
          savingsExpenses += amt;
        } else {
          needsExpenses += amt;
        }
      }
    });

    const totalExpenses = needsExpenses + wantsExpenses + savingsExpenses;
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savingsExpenses / totalIncome) * 100 : 0;

    return {
      monthStr,
      totalIncome,
      totalExpenses,
      variableExpenses,
      needsExpenses,
      wantsExpenses,
      savingsExpenses,
      balance,
      savingsRate,
      transactionCount: monthTx.length
    };
  }

  /**
   * Diagnóstico según la Regla 50/30/20 (BBVA)
   */
  static calculate503020(summary, fixedSummary) {
    const totalIncome = summary.totalIncome || fixedSummary.totalIncome || 4350000;
    const targetNeeds = totalIncome * 0.50;
    const targetWants = totalIncome * 0.30;
    const targetSavings = totalIncome * 0.20;

    const actualNeeds = summary.needsExpenses || fixedSummary.totalFixed;
    const actualWants = summary.wantsExpenses || 0;
    const actualSavings = summary.savingsExpenses || 0;

    return {
      baseIncome: totalIncome,
      needs: {
        target: targetNeeds,
        actual: actualNeeds,
        percentage: totalIncome > 0 ? (actualNeeds / totalIncome) * 100 : 0,
        diff: targetNeeds - actualNeeds,
        status: actualNeeds <= targetNeeds ? 'healthy' : 'warning'
      },
      wants: {
        target: targetWants,
        actual: actualWants,
        percentage: totalIncome > 0 ? (actualWants / totalIncome) * 100 : 0,
        diff: targetWants - actualWants,
        status: actualWants <= targetWants ? 'healthy' : 'warning'
      },
      savings: {
        target: targetSavings,
        actual: actualSavings,
        percentage: totalIncome > 0 ? (actualSavings / totalIncome) * 100 : 0,
        diff: actualSavings - targetSavings,
        status: actualSavings >= targetSavings ? 'healthy' : 'warning'
      }
    };
  }

  /**
   * Cálculo de Salud Financiera (0 a 100)
   */
  static calculateHealthScore(summary, budget503020, debts = [], fixedSummary) {
    let score = 70;
    const tips = [];

    // Fijos sobre ingresos
    if (fixedSummary && fixedSummary.fixedPercentageOfIncome > 70) {
      score -= 15;
      tips.push({ type: 'warning', text: `Tus gastos fijos representan el ${fixedSummary.fixedPercentageOfIncome.toFixed(0)}% del ingreso. Mantén vigilados los gastos variables para no exceder tu disponible diario.` });
    } else if (fixedSummary && fixedSummary.fixedPercentageOfIncome <= 65) {
      score += 10;
      tips.push({ type: 'success', text: `Tus gastos fijos están en un rango controlado (${fixedSummary.fixedPercentageOfIncome.toFixed(0)}% del total).` });
    }

    // Cash flow tramos
    if (fixedSummary && fixedSummary.cashFlow) {
      if (fixedSummary.cashFlow.tramo1.remainder >= 0) {
        tips.push({ type: 'info', text: `¡Excelente! Tu cobro del Tramo 1 ($${fixedSummary.cashFlow.tramo1.income.toLocaleString()}) cubre el 100% de los servicios y alquiler de la primera semana.` });
      } else {
        tips.push({ type: 'warning', text: `Atención: Los gastos del Tramo 1 superan el 19.5% inicial. Puedes mover algún pago al Tramo 2 (después del día 7).` });
      }
    }

    // Balance positivo
    if (summary.balance > 0) {
      score += 10;
    } else if (summary.balance < 0) {
      score -= 20;
      tips.push({ type: 'error', text: 'Estás gastando más de lo que ingresa en este periodo. Revisa tus movimientos no esenciales.' });
    }

    // Deudas
    const totalRemainingDebt = debts.reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);
    if (totalRemainingDebt === 0) {
      score += 10;
      tips.push({ type: 'success', text: '¡Excelente! No tienes deudas no controladas activas.' });
    } else {
      tips.push({ type: 'info', text: 'Usa el método Bola de Nieve o Avalancha en la pestaña 3 Pasos (Galicia) para liquidar tus tarjetas más rápido.' });
    }

    score = Math.max(10, Math.min(100, score));

    let level = 'Excelente';
    if (score < 50) level = 'Crítico';
    else if (score < 70) level = 'Atención';
    else if (score < 85) level = 'Saludable';

    return { score, level, tips };
  }

  /**
   * Métodos de Deuda (Galicia: Bola de Nieve y Avalancha)
   */
  static getDebtStrategies(debts) {
    const validDebts = debts.filter(d => Number(d.remainingAmount) > 0);
    const snowball = [...validDebts].sort((a, b) => Number(a.remainingAmount) - Number(b.remainingAmount));
    const avalanche = [...validDebts].sort((a, b) => Number(b.interestRate || 0) - Number(a.interestRate || 0));

    const totalDebt = validDebts.reduce((acc, d) => acc + Number(d.remainingAmount), 0);
    const totalMinPayment = validDebts.reduce((acc, d) => acc + Number(d.minimumPayment || 0), 0);

    return { snowball, avalanche, totalDebt, totalMinPayment };
  }

  /**
   * Cálculo de progreso de metas
   */
  static calculateGoalPacing(goal) {
    const target = Number(goal.targetAmount) || 0;
    const current = Number(goal.currentAmount) || 0;
    const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    const remaining = Math.max(0, target - current);

    let monthsLeft = 6;
    if (goal.deadline) {
      const now = new Date();
      const targetDate = new Date(goal.deadline);
      const diffMonths = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
      monthsLeft = Math.max(1, diffMonths);
    }

    const suggestedMonthly = remaining / monthsLeft;

    return { target, current, progress, remaining, monthsLeft, suggestedMonthly };
  }
}
