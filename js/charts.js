/**
 * charts.js - Gráficos interactivos con Chart.js (Dark/Light mode aware)
 */

class ChartsManager {
  static categoryChart = null;
  static rule503020Chart = null;
  static dailyTrendChart = null;

  static isDarkMode() {
    return document.documentElement.classList.contains('dark');
  }

  static getTextColor() {
    return this.isDarkMode() ? '#94a3b8' : '#64748b';
  }

  static getGridColor() {
    return this.isDarkMode() ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  }

  /**
   * Gráfico Donut de Desglose por Categoría
   */
  static renderCategoryChart(canvasId, categoryBreakdown, currencySymbol = '$') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const labels = Object.keys(categoryBreakdown);
    const data = Object.values(categoryBreakdown);

    if (labels.length === 0) {
      // Dibujar placeholder si no hay datos
      this.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Sin gastos este mes'],
          datasets: [{
            data: [1],
            backgroundColor: [this.isDarkMode() ? '#334155' : '#e2e8f0'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          },
          cutout: '72%'
        }
      });
      return;
    }

    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
      '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#84cc16'
    ];

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: this.isDarkMode() ? '#1e293b' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: this.getTextColor(),
              boxWidth: 12,
              padding: 14,
              font: { family: 'Plus Jakarta Sans', size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw || 0;
                const total = context.chart._metasets[0].total;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${currencySymbol}${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Gráfico de Barras Comparativo 50/30/20 (Meta vs. Real)
   */
  static render503020Chart(canvasId, budget503020, currencySymbol = '$') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.rule503020Chart) {
      this.rule503020Chart.destroy();
    }

    const labels = ['Necesidades (50%)', 'Deseos (30%)', 'Ahorro / Deuda (20%)'];
    const targets = [
      budget503020.needs.target,
      budget503020.wants.target,
      budget503020.savings.target
    ];
    const actuals = [
      budget503020.needs.spent,
      budget503020.wants.spent,
      budget503020.savings.spent
    ];

    this.rule503020Chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Presupuesto Ideal',
            data: targets,
            backgroundColor: 'rgba(148, 163, 184, 0.4)',
            borderColor: '#94a3b8',
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: 'Gasto / Ahorro Real',
            data: actuals,
            backgroundColor: [
              budget503020.needs.spent > budget503020.needs.target ? '#ef4444' : '#3b82f6',
              budget503020.wants.spent > budget503020.wants.target ? '#ef4444' : '#f59e0b',
              budget503020.savings.spent >= budget503020.savings.target ? '#10b981' : '#6ee7b7'
            ],
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: this.getTextColor(),
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }
            }
          },
          y: {
            grid: { color: this.getGridColor() },
            ticks: {
              color: this.getTextColor(),
              font: { family: 'Plus Jakarta Sans', size: 11 },
              callback: value => `${currencySymbol}${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: this.getTextColor(),
              font: { family: 'Plus Jakarta Sans', size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${currencySymbol}${context.raw.toLocaleString()}`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Gráfico de Evolución del Gasto Acumulado en el Mes
   */
  static renderDailyTrendChart(canvasId, transactions, monthStr, currencySymbol = '$') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.dailyTrendChart) {
      this.dailyTrendChart.destroy();
    }

    // Obtener días del mes
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const dailySpending = new Array(daysInMonth).fill(0);
    const monthExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(monthStr));

    monthExpenses.forEach(t => {
      const day = parseInt(t.date.split('-')[2], 10);
      if (day >= 1 && day <= daysInMonth) {
        dailySpending[day - 1] += Number(t.amount) || 0;
      }
    });

    let cumulative = 0;
    const cumulativeSpending = dailySpending.map(amount => {
      cumulative += amount;
      return cumulative;
    });

    this.dailyTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: days.map(d => `Día ${d}`),
        datasets: [{
          label: 'Gasto Acumulado',
          data: cumulativeSpending,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 6,
          pointBackgroundColor: '#2563eb'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: this.getTextColor(),
              maxTicksLimit: 10,
              font: { family: 'Plus Jakarta Sans', size: 11 }
            }
          },
          y: {
            grid: { color: this.getGridColor() },
            ticks: {
              color: this.getTextColor(),
              font: { family: 'Plus Jakarta Sans', size: 11 },
              callback: value => `${currencySymbol}${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` Total gastado a la fecha: ${currencySymbol}${context.raw.toLocaleString()}`;
              }
            }
          }
        }
      }
    });
  }

  static refreshAllCharts() {
    if (this.categoryChart) this.categoryChart.update();
    if (this.rule503020Chart) this.rule503020Chart.update();
    if (this.dailyTrendChart) this.dailyTrendChart.update();
  }
}
