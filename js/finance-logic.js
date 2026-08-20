/**
 * finance-logic.js - Algoritmos de cálculo financiero (BBVA 50/30/20, Galicia 3 Pasos, Washington Trust)
 */

class FinanceLogic {
  /**
   * Obtiene resumen de ingresos, gastos y balance para un mes dado (formato YYYY-MM)
   */
  static getMonthSummary(transactions, monthStr) {
    const monthTx = transactions.filter(t => t.date.startsWith(monthStr));
    
    let totalIncome = 0;
    let totalExpenses = 0;
    let needsSpent = 0;
    let wantsSpent = 0;
    let savingsSpent = 0;

    const categoryBreakdown = {};

    monthTx.forEach(t => {
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
        
        // Clasificación 50/30/20
        if (t.classification === 'need') needsSpent += amount;
        else if (t.classification === 'want') wantsSpent += amount;
        else if (t.classification === 'savings') savingsSpent += amount;
        else needsSpent += amount; // Por defecto a necesidad

        // Desglose por categoría
        const cat = t.category || 'Otros';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amount;
      }
    });

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
   * Distribución recomendada:
   * 50% Necesidades (Vivienda, Servicios, Comida, Transporte, Salud)
   * 30% Deseos (Ocio, Restaurantes, Caprichos, Streaming)
   * 20% Ahorro e Inversión / Pago de deudas
   */
  static calculate503020(summary, expectedIncome = 0) {
    // Si no hay ingresos cargados en el mes, usamos el ingreso esperado de la configuración
    const baseIncome = summary.totalIncome > 0 ? summary.totalIncome : expectedIncome;

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
  static calculateHealthScore(summary, budget503020, debts, bills) {
    let score = 0;
    const tips = [];

    // 1. Balance general (hasta 25 puntos)
    if (summary.totalIncome > 0) {
      if (summary.netBalance >= 0) {
        score += 25;
      } else {
        const deficitRatio = Math.abs(summary.netBalance) / summary.totalIncome;
        score += Math.max(0, Math.round(25 * (1 - deficitRatio)));
        tips.push({
          type: 'danger',
          text: 'Tus gastos superan tus ingresos este mes. Revisa tus gastos en Deseos para volver a un flujo positivo.'
        });
      }
    } else {
      score += 10;
      tips.push({
        type: 'info',
        text: 'Registra tus ingresos mensuales para un cálculo preciso de salud financiera.'
      });
    }

    // 2. Cumplimiento de la regla 50/30/20 (hasta 30 puntos)
    let ruleScore = 0;
    if (budget503020.needs.percentOfIncome <= 55) ruleScore += 12;
    else if (budget503020.needs.percentOfIncome <= 65) ruleScore += 6;
    else {
      tips.push({
        type: 'warning',
        text: `Tus necesidades consumen el ${budget503020.needs.percentOfIncome.toFixed(1)}% de tus ingresos (recomendado máximo 50%). Considera optimizar servicios o gastos fijos.`
      });
    }

    if (budget503020.wants.percentOfIncome <= 30) ruleScore += 10;
    else if (budget503020.wants.percentOfIncome <= 40) ruleScore += 5;
    else {
      tips.push({
        type: 'warning',
        text: `Tus deseos y caprichos están en ${budget503020.wants.percentOfIncome.toFixed(1)}% (meta 30%). Ajustar salidas y compras impulsivas liberará dinero para ahorrar.`
      });
    }

    if (budget503020.savings.percentOfIncome >= 20) ruleScore += 8;
    else if (budget503020.savings.percentOfIncome >= 10) ruleScore += 4;
    else {
      tips.push({
        type: 'info',
        text: 'Aplica la regla "Págate a ti primero" de Washington Trust: aparta al menos el 20% al recibir tus ingresos.'
      });
    }
    score += ruleScore;

    // 3. Control de deudas (hasta 25 puntos)
    const totalDebt = debts.reduce((sum, d) => sum + Number(d.remainingAmount || 0), 0);
    const monthlyDebtPayments = debts.reduce((sum, d) => sum + Number(d.minimumPayment || 0), 0);
    
    if (debts.length === 0 || totalDebt === 0) {
      score += 25;
    } else {
      const debtRatio = summary.totalIncome > 0 ? (monthlyDebtPayments / summary.totalIncome) * 100 : 30;
      if (debtRatio <= 20) score += 20;
      else if (debtRatio <= 35) {
        score += 12;
        tips.push({
          type: 'warning',
          text: `El servicio de tus deudas absorbe el ${debtRatio.toFixed(1)}% de tus ingresos. Utiliza el método Bola de Nieve para acelerar su cancelación.`
        });
      } else {
        score += 5;
        tips.push({
          type: 'danger',
          text: 'Nivel alto de endeudamiento. Prioriza el pago de deudas de mayor tasa con el método Avalancha de Galicia.'
        });
      }
    }

    // 4. Puntualidad en Facturas (hasta 20 puntos)
    const pendingBills = bills.filter(b => !b.isPaid);
    const currentDay = new Date().getDate();
    const overdueBills = pendingBills.filter(b => b.dueDay < currentDay);

    if (overdueBills.length === 0) {
      score += 20;
    } else {
      score += 5;
      tips.push({
        type: 'danger',
        text: `Tienes ${overdueBills.length} factura(s) con fecha de vencimiento superada. Pagarlas a tiempo evita recargos e intereses moratorios.`
      });
    }

    score = Math.min(100, Math.max(0, score));

    let level = 'Saludable';
    let color = 'emerald';
    if (score >= 85) { level = 'Excelente'; color = 'emerald'; }
    else if (score >= 70) { level = 'Bueno'; color = 'blue'; }
    else if (score >= 50) { level = 'Regular / Atención'; color = 'amber'; }
    else { level = 'Crítico / Requiere Acción'; color = 'rose'; }

    return {
      score,
      level,
      color,
      tips
    };
  }

  /**
   * Estrategias de desendeudamiento (Galicia Paso 2)
   * Bola de nieve (Snowball): ordenado de menor a mayor saldo restante.
   * Avalancha (Avalanche): ordenado de mayor a menor tasa de interés.
   */
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

    return {
      snowball,
      avalanche,
      totalDebt,
      totalMinPayment
    };
  }

  /**
   * Cálculo de Metas de Ahorro (Galicia Paso 3 & Washington Trust)
   * Calcula cuánto se debe ahorrar por mes para cumplir la meta en la fecha pactada.
   */
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

    return {
      ...goal,
      remaining,
      progress,
      monthsLeft,
      suggestedMonthly
    };
  }

  /**
   * Alertas de Facturas (Washington Trust Clave 5)
   */
  static getUpcomingBills(bills, daysWindow = 7) {
    const currentDay = new Date().getDate();
    return bills.map(b => {
      const dueDay = Number(b.dueDay) || 1;
      const daysUntilDue = dueDay - currentDay;
      let status = 'normal';
      let statusText = `Vence en ${daysUntilDue} días (Día ${dueDay})`;

      if (b.isPaid) {
        status = 'paid';
        statusText = 'Pagada';
      } else if (daysUntilDue < 0) {
        status = 'overdue';
        statusText = `Vencida hace ${Math.abs(daysUntilDue)} días`;
      } else if (daysUntilDue === 0) {
        status = 'due-today';
        statusText = '¡Vence hoy!';
      } else if (daysUntilDue <= daysWindow) {
        status = 'due-soon';
        statusText = `Vence en ${daysUntilDue} días`;
      }

      return {
        ...b,
        daysUntilDue,
        status,
        statusText
      };
    }).sort((a, b) => {
      if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
      return a.dueDay - b.dueDay;
    });
  }
}
