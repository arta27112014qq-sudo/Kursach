// Данные для диаграмм - сбор реальных данных из системы
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Функции для работы с данными из других модулей
function loadReport() {
  const raw = localStorage.getItem('lan-admin-report');
  if (!raw) return { pcRevenueCash: 0, pcRevenueCard: 0, fridgeRevenueCash: 0, fridgeRevenueCard: 0 };
  try {
    const parsed = JSON.parse(raw);
    return {
      pcRevenueCash: Number(parsed.pcRevenueCash || 0),
      pcRevenueCard: Number(parsed.pcRevenueCard || 0),
      fridgeRevenueCash: Number(parsed.fridgeRevenueCash || 0),
      fridgeRevenueCard: Number(parsed.fridgeRevenueCard || 0),
    };
  } catch (error) {
    return { pcRevenueCash: 0, pcRevenueCard: 0, fridgeRevenueCash: 0, fridgeRevenueCard: 0 };
  }
}

// Сбор реальных транзакций из системы
function collectRealTransactions() {
  const today = new Date().toISOString().split('T')[0];
  const report = loadReport();
  
  // Очищаем сегодняшние транзакции из отчетов и пересобираем
  transactions = transactions.filter(t => t.date !== today || t.source !== 'reports');
  
  // Добавляем данные из отчетов - разделяем наличные и карты
  if (report.fridgeRevenueCash > 0) {
    transactions.push({
      type: 'cash',
      amount: report.fridgeRevenueCash,
      category: 'Напитки',
      time: '12:00',
      date: today,
      source: 'reports'
    });
  }
  
  if (report.fridgeRevenueCard > 0) {
    transactions.push({
      type: 'card',
      amount: report.fridgeRevenueCard,
      category: 'Напитки',
      time: '12:30',
      date: today,
      source: 'reports'
    });
  }
  
  if (report.pcRevenueCash > 0) {
    transactions.push({
      type: 'cash',
      amount: report.pcRevenueCash,
      category: null,
      time: '10:00',
      date: today,
      source: 'reports'
    });
  }
  
  if (report.pcRevenueCard > 0) {
    transactions.push({
      type: 'card',
      amount: report.pcRevenueCard,
      category: null,
      time: '10:30',
      date: today,
      source: 'reports'
    });
  }
  
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

let paymentChart, timelineChart, categoryChart;

// Инициализация диаграмм
function initCharts() {
  // Диаграмма по способам оплаты
  const paymentCtx = document.getElementById('paymentChart').getContext('2d');
  paymentChart = new Chart(paymentCtx, {
    type: 'doughnut',
    data: {
      labels: ['Пополнения наличными', 'Оплаты картой', 'Продажи еды'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: [
          '#4CAF50',
          '#2196F3',
          '#FF9800'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ' + context.parsed + ' ₽';
            }
          }
        }
      }
    }
  });

  // Диаграмма динамики по времени
  const timelineCtx = document.getElementById('timelineChart').getContext('2d');
  timelineChart = new Chart(timelineCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Пополнения наличными',
          data: [],
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4
        },
        {
          label: 'Оплаты картой',
          data: [],
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4
        },
        {
          label: 'Продажи еды',
          data: [],
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value + ' ₽';
            }
          }
        }
      }
    }
  });

  // Сразу обновляем данные
  updateCharts();
}

// Обновление данных диаграмм
function updateCharts() {
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date === today);

  // Подсчет totals
  const cashTotal = todayTransactions
    .filter(t => t.type === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const cardTotal = todayTransactions
    .filter(t => t.type === 'card')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const foodTotal = todayTransactions
    .filter(t => t.type === 'food')
    .reduce((sum, t) => sum + t.amount, 0);

  // Обновление карточек
  document.getElementById('cashTotal').textContent = cashTotal + ' ₽';
  document.getElementById('cardTotal').textContent = cardTotal + ' ₽';
  document.getElementById('foodTotal').textContent = foodTotal + ' ₽';

  // Обновление диаграммы способов оплаты
  paymentChart.data.datasets[0].data = [cashTotal, cardTotal, foodTotal];
  paymentChart.update();

  // Обновление диаграммы динамики
  const timeSlots = {};
  todayTransactions.forEach(t => {
    const hour = t.time.split(':')[0] + ':00';
    if (!timeSlots[hour]) {
      timeSlots[hour] = { cash: 0, card: 0, food: 0 };
    }
    timeSlots[hour][t.type] += t.amount;
  });

  const sortedHours = Object.keys(timeSlots).sort();
  timelineChart.data.labels = sortedHours;
  timelineChart.data.datasets[0].data = sortedHours.map(h => timeSlots[h].cash);
  timelineChart.data.datasets[1].data = sortedHours.map(h => timeSlots[h].card);
  timelineChart.data.datasets[2].data = sortedHours.map(h => timeSlots[h].food);
  timelineChart.update();
  
  console.log('Timeline data:', timeSlots); // Для отладки
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  console.log('Loading diagram page...');
  collectRealTransactions();
  console.log('Transactions collected:', transactions);
  initCharts();
});
