const STOCK_KEY = "lan-admin-fridge-stock";
const REPORT_KEY = "lan-admin-report";
const PCS_KEY = "lan-admin-pcs";

const DEFAULT_STOCK = [
  { name: "Red Bull", category: "Энергос", count: 14, price: 180, image: "pic/rb.jpg" },
  { name: "Adrenaline Rush", category: "Энергос", count: 12, price: 170, image: "pic/adr.jpg" },
  { name: "Monster", category: "Энергос", count: 10, price: 190, image: "pic/moster.jpg" },
  { name: "Burn", category: "Энергос", count: 10, price: 165, image: "pic/Burn.jpg" },
  { name: "Gorilla", category: "Энергос", count: 12, price: 160, image: "pic/Gorilla.jpg" },
  { name: "Flash Up", category: "Энергос", count: 9, price: 150, image: "pic/Flash Up.jpg" },
  { name: "Lit Energy", category: "Энергос", count: 8, price: 155, image: "pic/Lit Energy.jpg" },
  { name: "Вода 0.5", category: "Напиток", count: 18, price: 80, image: "pic/Вода.jpg" },
  { name: "Cola 0.5", category: "Напиток", count: 16, price: 120, image: "pic/Cola.jpg" },
  { name: "Fanta 0.5", category: "Напиток", count: 14, price: 120, image: "pic/fanta.jpg" },
  { name: "Сок 0.33", category: "Напиток", count: 12, price: 110, image: "pic/Сок.jpg" },
  { name: "Сэндвич", category: "Сэндвичи", count: 10, price: 220, image: "pic/Сэндвич.jpg" },
  { name: "Snickers", category: "Шоколад", count: 16, price: 110, image: "pic/Snickers.png" },
  { name: "Twix", category: "Шоколад", count: 15, price: 110, image: "pic/Twix.jpg" },
  { name: "Mars", category: "Шоколад", count: 14, price: 110, image: "pic/Mars.jpg" },
  { name: "KitKat", category: "Шоколад", count: 12, price: 120, image: "pic/KitKat.jpg" },
  { name: "Bounty", category: "Шоколад", count: 11, price: 120, image: "pic/Bounty.jpg" },
  { name: "Чипсы", category: "Еда", count: 13, price: 140, image: "pic/чипсы.jpg" },
  { name: "Орешки", category: "Еда", count: 11, price: 130, image: "pic/Oip.jpg" },
  { name: "Печенье", category: "Еда", count: 12, price: 100, image: "pic/Печенье.jpg" },
];

function loadStock() {
  const raw = localStorage.getItem(STOCK_KEY);
  if (!raw) return DEFAULT_STOCK;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== DEFAULT_STOCK.length) return DEFAULT_STOCK;
    return parsed.map((item, index) => ({
      ...DEFAULT_STOCK[index],
      ...item,
      count: Number(item.count || 0),
      price: Number(item.price || DEFAULT_STOCK[index].price),
      image: item.image || DEFAULT_STOCK[index].image,
    }));
  } catch (error) {
    return DEFAULT_STOCK;
  }
}

function saveStock(items) {
  localStorage.setItem(STOCK_KEY, JSON.stringify(items));
}

function addFridgeRevenue(amount) {
  if (amount <= 0) return;
  const raw = localStorage.getItem(REPORT_KEY);
  const report = raw ? JSON.parse(raw) : { pcRevenue: 0, fridgeRevenue: 0 };
  report.pcRevenue = Number(report.pcRevenue || 0);
  report.fridgeRevenue = Number(report.fridgeRevenue || 0) + amount;
  localStorage.setItem(REPORT_KEY, JSON.stringify(report));
}

function addPcRevenue(amount) {
  if (amount <= 0) return;
  const raw = localStorage.getItem(REPORT_KEY);
  const report = raw ? JSON.parse(raw) : { pcRevenue: 0, fridgeRevenue: 0 };
  report.pcRevenue = Number(report.pcRevenue || 0) + amount;
  report.fridgeRevenue = Number(report.fridgeRevenue || 0);
  localStorage.setItem(REPORT_KEY, JSON.stringify(report));
}

function loadPcList() {
  const raw = localStorage.getItem(PCS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    return [];
  }
}

function addBalanceToPc(pcId, amount) {
  const safeAmount = Number(amount || 0);
  if (!pcId || safeAmount <= 0) return false;
  const pcs = loadPcList();
  const index = pcs.findIndex((pc) => pc.id === pcId);
  if (index < 0) return false;
  pcs[index].balance = Number(pcs[index].balance || 0) + safeAmount;
  pcs[index].lastEvent = `Пополнение через кассу: ${safeAmount} ₽`;
  localStorage.setItem(PCS_KEY, JSON.stringify(pcs));
  addPcRevenue(safeAmount);
  return true;
}
