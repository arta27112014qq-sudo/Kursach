const stockState = loadStock();

function renderStock() {
  const body = document.getElementById("stockTableBody");
  body.innerHTML = "";

  stockState.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td class="value-positive">${item.count} шт.</td>
      <td>${item.price}</td>
      <td><input id="add-${index}" type="number" min="0" value="0" /></td>
      <td><button data-index="${index}" class="add-stock-btn">Добавить</button></td>
    `;
    body.appendChild(row);
  });

  document.querySelectorAll(".add-stock-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const input = document.getElementById(`add-${index}`);
      const addCount = Number(input.value || 0);
      if (addCount > 0) {
        stockState[index].count += addCount;
        saveStock(stockState);
        renderStock();
      }
    });
  });
}

renderStock();
