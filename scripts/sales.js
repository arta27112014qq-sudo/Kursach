const salesState = loadStock();
const cart = {};

function categoryOrder(category) {
  if (category === "Энергос") return 1;
  if (category === "Напиток") return 2;
  if (category === "Сэндвичи") return 3;
  if (category === "Шоколад") return 4;
  return 5;
}

function formatRub(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")} ₽`;
}

function renderPcSelect() {
  const select = document.getElementById("topupPc");
  const pcs = loadPcList();
  select.innerHTML = `<option value="">Не пополнять</option>`;
  pcs.forEach((pc) => {
    const option = document.createElement("option");
    option.value = pc.id;
    option.textContent = `${pc.id} (${pc.tier || "ПК"})`;
    select.appendChild(option);
  });
}

function renderSales() {
  const root = document.getElementById("salesGroups");
  root.innerHTML = "";

  const categories = [...new Set(salesState.map((item) => item.category))].sort(
    (a, b) => categoryOrder(a) - categoryOrder(b)
  );

  categories.forEach((category) => {
    const section = document.createElement("section");
    section.className = "tier-section";
    section.innerHTML = `
      <div class="tier-header"><h3>${category}</h3></div>
      <div class="sales-grid" id="sales-${category}"></div>
    `;
    root.appendChild(section);

    const grid = document.getElementById(`sales-${category}`);
    salesState.forEach((item, index) => {
      if (item.category !== category) return;
      const itemCard = document.createElement("article");
      itemCard.className = "sale-card";
      itemCard.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="sale-photo" />
        <h4>${item.name}</h4>
        <p>Цена: <strong>${item.price} ₽</strong></p>
        <p>Остаток: <strong>${item.count} шт.</strong></p>
        <div class="sale-controls">
          <input type="number" min="1" max="${item.count}" value="1" data-index="${index}" class="sale-qty" />
          <button data-index="${index}" class="add-cart-btn" ${item.count <= 0 ? "disabled" : ""}>В чек</button>
        </div>
      `;
      grid.appendChild(itemCard);
    });
  });

  document.querySelectorAll(".add-cart-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const item = salesState[index];
      const qtyInput = document.querySelector(`.sale-qty[data-index="${index}"]`);
      const qty = Math.max(1, Number(qtyInput.value || 1));
      if (item.count <= 0) return;
      if (qty > item.count) return;
      cart[index] = Number(cart[index] || 0) + qty;
      renderCart();
    });
  });
}

function renderCart() {
  const root = document.getElementById("cartItems");
  root.innerHTML = "";
  let foodTotal = 0;
  Object.entries(cart).forEach(([index, qty]) => {
    const item = salesState[Number(index)];
    if (!item || qty <= 0) return;
    const sum = qty * item.price;
    foodTotal += sum;
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <span>${item.name} × ${qty}</span>
      <span>${formatRub(sum)}</span>
    `;
    root.appendChild(row);
  });

  if (!root.innerHTML) root.innerHTML = "<p class='hint'>Товары не выбраны.</p>";

  const topupAmount = Number(document.getElementById("topupAmount").value || 0);
  document.getElementById("foodTotal").textContent = formatRub(foodTotal);
  document.getElementById("topupTotal").textContent = formatRub(topupAmount);
  document.getElementById("grandTotal").textContent = formatRub(foodTotal + topupAmount);
}

function checkout() {
  const note = document.getElementById("checkoutNote");
  const paymentMethod = document.getElementById("paymentMethod").value;
  const topupAmount = Number(document.getElementById("topupAmount").value || 0);
  const topupPc = document.getElementById("topupPc").value;
  const cartEntries = Object.entries(cart);

  if (topupAmount > 0 && !topupPc) {
    note.textContent = "Выберите ПК для пополнения.";
    return;
  }

  let foodTotal = 0;
  for (const [indexRaw, qty] of cartEntries) {
    const index = Number(indexRaw);
    const item = salesState[index];
    if (!item || qty <= 0) continue;
    if (item.count < qty) {
      note.textContent = `Недостаточно остатка: ${item.name}`;
      return;
    }
    foodTotal += qty * item.price;
  }

  if (foodTotal <= 0 && topupAmount <= 0) {
    note.textContent = "Добавьте товары или сумму пополнения.";
    return;
  }

  for (const [indexRaw, qty] of cartEntries) {
    const index = Number(indexRaw);
    const item = salesState[index];
    if (!item || qty <= 0) continue;
    item.count -= qty;
  }

  if (foodTotal > 0) addFridgeRevenue(foodTotal);

  if (topupAmount > 0) {
    const success = addBalanceToPc(topupPc, topupAmount);
    if (!success) {
      note.textContent = "Не удалось пополнить выбранный ПК.";
      return;
    }
  }

  saveStock(salesState);
  Object.keys(cart).forEach((key) => delete cart[key]);
  document.getElementById("topupAmount").value = "0";
  const total = foodTotal + topupAmount;
  note.textContent = `Оплата проведена (${paymentMethod}). Итого: ${formatRub(total)}.`;
  renderSales();
  renderCart();
}

document.getElementById("topupAmount").addEventListener("input", renderCart);
document.getElementById("checkoutBtn").addEventListener("click", checkout);

renderPcSelect();
renderSales();
renderCart();
