const REPORT_KEY = "lan-admin-report";

function formatRub(value) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function loadReport() {
  const raw = localStorage.getItem(REPORT_KEY);
  if (!raw) return { pcRevenue: 0, fridgeRevenue: 0 };
  try {
    const parsed = JSON.parse(raw);
    return {
      pcRevenue: Number(parsed.pcRevenue || 0),
      fridgeRevenue: Number(parsed.fridgeRevenue || 0),
    };
  } catch (error) {
    return { pcRevenue: 0, fridgeRevenue: 0 };
  }
}

function saveReport(report) {
  localStorage.setItem(REPORT_KEY, JSON.stringify(report));
}

function renderRevenue(report) {
  document.getElementById("pcRevenueTotal").textContent = formatRub(report.pcRevenue);
  document.getElementById("fridgeRevenueTotal").textContent = formatRub(report.fridgeRevenue);
  document.getElementById("dayTotal").textContent = formatRub(report.pcRevenue + report.fridgeRevenue);
}

const reportState = loadReport();
renderRevenue(reportState);

document.getElementById("pcRevenueInput").value = reportState.pcRevenue;
document.getElementById("fridgeRevenueInput").value = reportState.fridgeRevenue;

document.getElementById("revenueForm").addEventListener("submit", (event) => {
  event.preventDefault();
  reportState.pcRevenue = Number(document.getElementById("pcRevenueInput").value || 0);
  reportState.fridgeRevenue = Number(document.getElementById("fridgeRevenueInput").value || 0);
  saveReport(reportState);
  renderRevenue(reportState);
});
