const REPORT_KEY = "lan-admin-report";

function formatRub(value) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function loadReport() {
  const raw = localStorage.getItem(REPORT_KEY);
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

function saveReport(report) {
  localStorage.setItem(REPORT_KEY, JSON.stringify(report));
}

function renderRevenue(report) {
  const pcTotal = report.pcRevenueCash + report.pcRevenueCard;
  const fridgeTotal = report.fridgeRevenueCash + report.fridgeRevenueCard;
  const dayTotal = pcTotal + fridgeTotal;
  
  document.getElementById("pcRevenueTotal").textContent = formatRub(pcTotal);
  document.getElementById("fridgeRevenueTotal").textContent = formatRub(fridgeTotal);
  document.getElementById("dayTotal").textContent = formatRub(dayTotal);
}

const reportState = loadReport();
renderRevenue(reportState);

document.getElementById("pcRevenueCashInput").value = reportState.pcRevenueCash;
document.getElementById("pcRevenueCardInput").value = reportState.pcRevenueCard;
document.getElementById("fridgeRevenueCashInput").value = reportState.fridgeRevenueCash;
document.getElementById("fridgeRevenueCardInput").value = reportState.fridgeRevenueCard;
