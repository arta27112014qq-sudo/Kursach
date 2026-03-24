const BOOKING_KEY = "lan-admin-bookings";
const PCS_KEY = "lan-admin-pcs";

function buildTimeSlots(startHour = 8, endHour = 24) {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    slots.push(`${String(hour).padStart(2, "0")}:30`);
  }
  return slots;
}

function buildDateSlots(daysAhead = 3, startHour = 8, endHour = 24) {
  const timeSlots = buildTimeSlots(startHour, endHour);
  const flatSlots = [];
  const dayGroups = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + dayOffset);
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, "0");
    const dd = String(day.getDate()).padStart(2, "0");
    const dayKey = `${yyyy}-${mm}-${dd}`;
    const dayLabel = `${dd}.${mm}`;
    dayGroups.push({
      dayKey,
      dayLabel,
      slotCount: timeSlots.length,
    });
    timeSlots.forEach((time) => {
      flatSlots.push({
        key: `${dayKey}T${time}`,
        timeLabel: time,
        dayLabel,
      });
    });
  }

  return { flatSlots, dayGroups };
}

function createBookingKey(pcId, dateTimeKey) {
  return `${pcId}__${dateTimeKey}`;
}

function loadBookings() {
  const raw = localStorage.getItem(BOOKING_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function saveBookings(bookings) {
  localStorage.setItem(BOOKING_KEY, JSON.stringify(bookings));
}

function loadPcIds() {
  const raw = localStorage.getItem(PCS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((pc) => pc.id).filter(Boolean);
  } catch (error) {
    return [];
  }
}

function loadPcStatusMap() {
  const raw = localStorage.getItem(PCS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return {};
    return parsed.reduce((acc, pc) => {
      if (pc.id) {
        acc[pc.id] = {
          status: pc.status,
          allocatedMinutes: Number(pc.allocatedMinutes || 0),
        };
      }
      return acc;
    }, {});
  } catch (error) {
    return {};
  }
}

function currentSlotIndex(slots) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = now.getMinutes() < 30 ? "00" : "30";
  const slotKey = `${yyyy}-${month}-${day}T${hh}:${min}`;
  const index = slots.findIndex((slot) => slot.key === slotKey);
  return index >= 0 ? index : 0;
}

function renderBookingGrid() {
  const container = document.getElementById("bookingGrid");
  const scrollInput = document.getElementById("bookingScroll");
  const { flatSlots, dayGroups } = buildDateSlots(4);
  const bookings = loadBookings();
  const pcs = loadPcIds();
  const statusMap = loadPcStatusMap();
  const activeFrom = currentSlotIndex(flatSlots);

  const table = document.createElement("table");
  table.className = "booking-table";

  const thead = document.createElement("thead");
  const dayRow = document.createElement("tr");
  dayRow.innerHTML = `<th class="row-label">PC \\ Дата</th>`;
  dayGroups.forEach((group) => {
    const th = document.createElement("th");
    th.textContent = group.dayLabel;
    th.colSpan = group.slotCount;
    th.className = "date-header";
    dayRow.appendChild(th);
  });

  const timeRow = document.createElement("tr");
  timeRow.innerHTML = `<th class="row-label">PC \\ Время</th>`;
  flatSlots.forEach((slot) => {
    const th = document.createElement("th");
    th.textContent = slot.timeLabel;
    timeRow.appendChild(th);
  });
  thead.appendChild(dayRow);
  thead.appendChild(timeRow);

  const tbody = document.createElement("tbody");
  pcs.forEach((pcId) => {
    const row = document.createElement("tr");
    const pcState = statusMap[pcId] || {};
    const isBusy = pcState.status === "Занят";
    const busySlots = isBusy ? Math.max(1, Math.ceil((pcState.allocatedMinutes || 0) / 30)) : 0;
    const busyUntil = activeFrom + busySlots;
    row.innerHTML = `<th class="row-label">${pcId}</th>`;
    flatSlots.forEach((slot, idx) => {
      const td = document.createElement("td");
      const key = createBookingKey(pcId, slot.key);
      td.className = "slot";
      if (isBusy && idx >= activeFrom && idx < busyUntil) td.classList.add("busy-pc");
      if (bookings[key]) td.classList.add("booked");
      td.dataset.pc = pcId;
      td.dataset.slotKey = slot.key;
      td.dataset.slotIndex = idx;
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  container.innerHTML = "";
  if (!pcs.length) {
    container.innerHTML = "<p class='hint'>Сначала откройте раздел Управление PC, чтобы инициализировать список компьютеров.</p>";
    return;
  }
  container.appendChild(table);

  const syncSlider = () => {
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    scrollInput.max = String(maxScroll);
    scrollInput.value = String(Math.min(Number(scrollInput.value || 0), maxScroll));
  };
  syncSlider();

  scrollInput.addEventListener("input", () => {
    container.scrollLeft = Number(scrollInput.value || 0);
  });
  container.addEventListener("scroll", () => {
    scrollInput.value = String(Math.round(container.scrollLeft));
  });
  window.addEventListener("resize", syncSlider);

  let rangeStart = null;
  table.addEventListener("click", (event) => {
    const target = event.target;
    if (!target.classList.contains("slot")) return;

    if (!rangeStart) {
      rangeStart = target;
      table.querySelectorAll(".slot").forEach((slot) => slot.classList.remove("selected"));
      target.classList.add("selected");
      return;
    }

    if (rangeStart.dataset.pc !== target.dataset.pc) {
      rangeStart.classList.remove("selected");
      rangeStart = target;
      target.classList.add("selected");
      return;
    }

    const startIndex = Number(rangeStart.dataset.slotIndex);
    const endIndex = Number(target.dataset.slotIndex);
    const from = Math.min(startIndex, endIndex);
    const to = Math.max(startIndex, endIndex);
    const pcId = target.dataset.pc;

    for (let index = from; index <= to; index += 1) {
      const cell = table.querySelector(`.slot[data-pc="${pcId}"][data-slot-index="${index}"]`);
      const key = createBookingKey(pcId, cell.dataset.slotKey);
      bookings[key] = !Boolean(bookings[key]);
      cell.classList.toggle("booked", bookings[key]);
      cell.classList.remove("selected");
    }

    saveBookings(bookings);
    rangeStart = null;
  });
}

renderBookingGrid();
