const TYPE_PRICES = { 'Одноместный':3000,'Двухместный':4000,'Полулюкс':5000,'Люкс':7500 };
const TYPE_ICONS  = { 'Одноместный':'🛏','Двухместный':'🛏🛏','Полулюкс':'🌟','Люкс':'👑' };
const PER_PAGE_OPTIONS = [8, 16, 32, 64];
const PER_PAGE_DEFAULT = 8;

let _editRoomId   = null;
let _deleteRoomId = null;
let _allRooms     = [];
let _currentPage  = 1;
let _openDropdownId = null;
let _perPage = parseInt(localStorage.getItem('hms-rooms-perpage'), 10) || PER_PAGE_DEFAULT;

/* ── Вычисление бейджа статуса с учётом needs_cleaning ── */
function roomDisplayStatus(r) {
  if (r.status === 'занят')       return { label:'Занят',          cls:'badge-danger' };
  if (r.status === 'недоступен')  return { label:'Недоступен',     cls:'badge-muted' };
  if (r.needs_cleaning)           return { label:'Требует уборки',  cls:'badge-warn' };
  return { label:'Свободен', cls:'badge-success' };
}

/* ── Форматирование даты выезда ───────────────────────── */
function formatCheckout(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const months = ['января','февраля','марта','апреля','мая','июня',
    'июля','августа','сентября','октября','ноября','декабря'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/* ── Форматирование даты уборки ───────────────────────── */
function formatCleanedDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  if (isToday) return `сегодня, ${hh}:${mm}`;
  const months = ['января','февраля','марта','апреля','мая','июня',
    'июля','августа','сентября','октября','ноября','декабря'];
  return `${d.getDate()} ${months[d.getMonth()]}, ${hh}:${mm}`;
}

/* ── Статистика ───────────────────────────────────────── */
function renderStats(rooms) {
  const total    = rooms.length;
  const free     = rooms.filter(r => r.status === 'свободен' && !r.needs_cleaning).length;
  const busy     = rooms.filter(r => r.status === 'занят').length;
  const cleaning = rooms.filter(r => r.needs_cleaning).length;

  const stats = [
    { val: total,    lbl: 'Всего номеров',  color: 'var(--text)',      icon: 'layout-grid' },
    { val: free,     lbl: 'Свободно',       color: 'var(--success)',  icon: 'circle-check-big' },
    { val: busy,     lbl: 'Занято',         color: 'var(--danger)',   icon: 'door-closed' },
    { val: cleaning, lbl: 'Требует уборки', color: 'var(--warn-text)', icon: 'sparkles' },
  ];

  document.getElementById('roomStats').innerHTML = stats.map(s => `
    <div class="card room-stat-card">
      <div class="room-stat-top">
        <span class="room-stat-icon" style="color:${s.color}"><i data-lucide="${s.icon}"></i></span>
        <div class="stat-val" style="color:${s.color}">${s.val}</div>
      </div>
      <div class="stat-lbl">${s.lbl}</div>
    </div>`).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ── Пагинация ────────────────────────────────────────── */
function renderPagination(total, page) {
  const pag = document.getElementById('roomsPagination');
  const pages = Math.ceil(total / _perPage);

  const perPageOpts = PER_PAGE_OPTIONS.map(n =>
    `<option value="${n}" ${n === _perPage ? 'selected' : ''}>${n}</option>`).join('');

  if (pages <= 1) {
    pag.innerHTML = `
      <div class="rooms-pagination-info">Показано ${total ? 1 : 0}–${total} из ${total} номеров</div>
      <div class="rooms-pagination-pages">
        <select class="filter-select" onchange="changePerPage(this.value)">${perPageOpts}</select>
      </div>`;
    pag.style.display = 'flex';
    return;
  }

  const from = (page - 1) * _perPage + 1;
  const to   = Math.min(page * _perPage, total);

  let btns = '';
  for (let i = 1; i <= pages; i++) {
    btns += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  pag.innerHTML = `
    <div class="rooms-pagination-info">Показано ${from}–${to} из ${total} номеров</div>
    <div class="rooms-pagination-pages">
      <select class="filter-select" onchange="changePerPage(this.value)">${perPageOpts}</select>
      ${btns}
    </div>`;
  pag.style.display = 'flex';
}

function changePerPage(n) {
  _perPage = parseInt(n, 10) || PER_PAGE_DEFAULT;
  localStorage.setItem('hms-rooms-perpage', String(_perPage));
  _currentPage = 1;
  renderRooms();
}

function goToPage(p) {
  _currentPage = p;
  renderRooms();
}

/* ── Фильтрация ───────────────────────────────────────── */
function getFilteredRooms() {
  const search = document.getElementById('searchRoom')?.value.trim().toLowerCase() || '';
  const type   = document.getElementById('filterType')?.value   || '';
  const status = document.getElementById('filterStatus')?.value || '';

  let rooms = _allRooms;
  if (search) rooms = rooms.filter(r => r.number.toLowerCase().includes(search));
  if (type)   rooms = rooms.filter(r => r.type   === type);
  if (status) rooms = rooms.filter(r => r.status === status);
  return rooms;
}

/* ── Карточка номера ──────────────────────────────────── */
function renderRoomCard(r) {
  const ds = roomDisplayStatus(r);

  // note тултип
  const noteHtml = r.note
    ? `<span class="room-note-icon">i<span class="room-note-tip">${utils.escapeHtml(r.note)}</span></span>`
    : '';

  // Нижний блок — зависит от статуса
  let footerContent = '';
  if (r.needs_cleaning) {
    footerContent = `<button class="btn btn-sm btn-success" onclick="markCleaned(${r.id})">Отметить убранным</button>`;
  } else if (r.status === 'занят') {
    const checkout = formatCheckout(r.active_checkout);
    footerContent = checkout
      ? `<div class="room-info-line">Выезд: <strong>${checkout}</strong>, 10:00</div>`
      : `<div class="room-info-line">Занят</div>`;
  } else if (r.status === 'свободен') {
    const cleaned = formatCleanedDate(r.last_cleaned_at);
    footerContent = cleaned
      ? `<div class="room-info-line">Убрано: <strong>${cleaned}</strong></div>`
      : `<button class="btn btn-sm btn-primary" onclick="goToBookings(${r.id})">Заселить</button>`;
  } else if (r.status === 'недоступен') {
    footerContent = `<div class="room-info-line">Недоступен</div>`;
  }

  // Цвет полосы карточки
  const barColor = r.status === 'занят' ? 'busy' : r.status === 'недоступен' ? 'unavailable' : 'free';

  return `
    <div class="card room-card ${barColor}" data-room-id="${r.id}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
        <div>
          <div class="room-number">№${utils.escapeHtml(r.number)}</div>
          <div class="room-type">${TYPE_ICONS[r.type]||'🏨'} ${utils.escapeHtml(r.type)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <span class="badge ${ds.cls}">${ds.label}</span>${noteHtml}
          <button class="room-menu-btn" onclick="toggleDropdown(event, ${r.id})">⋯</button>
          <div class="room-dropdown" id="dropdown-${r.id}">
            <div class="room-dropdown-item" onclick="openEditRoom(${r.id})">✏️ Редактировать</div>
            <div class="room-dropdown-item danger" onclick="openDeleteRoom(${r.id})">🗑️ Удалить</div>
          </div>
        </div>
      </div>
      <div class="room-price num">
        ${Number(r.price).toLocaleString('ru-RU')} ₽<span>/ ночь</span>
      </div>
      <div class="room-footer">
        <div></div>
        <div>${footerContent}</div>
      </div>
    </div>`;
}

/* ── Главная функция рендера ──────────────────────────── */
async function renderRooms() {
  try {
    _allRooms = await DB.getRooms();
    renderStats(_allRooms);

    const count = document.getElementById('roomCount');
    if (count) count.textContent = `(${_allRooms.length})`;

    const filtered = getFilteredRooms();
    const total = filtered.length;

    // Пагинация
    const pages = Math.ceil(total / _perPage);
    if (_currentPage > pages) _currentPage = 1;
    const start = (_currentPage - 1) * _perPage;
    const pageRooms = filtered.slice(start, start + _perPage);

    const grid = document.getElementById('roomsGrid');
    if (!pageRooms.length) { utils.empty(grid, 'Номера не найдены'); renderPagination(0, _currentPage); return; }

    grid.innerHTML = pageRooms.map(renderRoomCard).join('');
    renderPagination(total, _currentPage);
  } catch (e) { toast.error(e.message); }
}

/* ── Dropdown меню ────────────────────────────────────── */
function toggleDropdown(e, id) {
  e.stopPropagation();
  // Закрыть предыдущий
  if (_openDropdownId && _openDropdownId !== id) {
    document.getElementById(`dropdown-${_openDropdownId}`)?.classList.remove('open');
  }
  const dd = document.getElementById(`dropdown-${id}`);
  dd.classList.toggle('open');
  _openDropdownId = dd.classList.contains('open') ? id : null;
}

document.addEventListener('click', () => {
  if (_openDropdownId) {
    document.getElementById(`dropdown-${_openDropdownId}`)?.classList.remove('open');
    _openDropdownId = null;
  }
});

/* ── Отметить убранным ────────────────────────────────── */
async function markCleaned(id) {
  try {
    await DB.markRoomCleaned(id);
    toast.success('Номер отмечен как убранный');
    renderRooms();
  } catch (e) { toast.error(e.message); }
}

/* ── Переход на страницу бронирования с предвыбором номера ── */
function goToBookings(roomId) {
  window.location.href = `bookings.html?room=${roomId}`;
}

/* ── Модалка добавления/редактирования ────────────────── */
function openAddRoom() {
  _editRoomId = null;
  document.getElementById('roomModalTitle').textContent = 'Новый номер';
  ['roomId','roomNumber','roomPrice','roomNote'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('roomType').value   = 'Одноместный';
  document.getElementById('roomStatus').value = 'свободен';
  autoPrice();
  modal.open('roomModal');
}

async function openEditRoom(id) {
  try {
    const room = _allRooms.find(r => r.id === id) || (await DB.getRooms()).find(r => r.id === id);
    if (!room) return;
    _editRoomId = id;
    document.getElementById('roomModalTitle').textContent = `Редактировать №${room.number}`;
    document.getElementById('roomId').value      = room.id;
    document.getElementById('roomNumber').value  = room.number;
    document.getElementById('roomType').value    = room.type;
    document.getElementById('roomPrice').value   = Number(room.price); // I-024: убирает ".00"
    document.getElementById('roomStatus').value  = room.status;
    document.getElementById('roomNote').value    = room.note || '';
    modal.open('roomModal');
  } catch (e) { toast.error(e.message); }
}

function autoPrice() {
  if (_editRoomId) return;
  const type = document.getElementById('roomType')?.value;
  if (type) document.getElementById('roomPrice').value = TYPE_PRICES[type] || '';
}

async function saveRoom() {
  const ok = validateForm([
    { id:'roomNumber', errId:'errRoomNumber', required:true },
    { id:'roomPrice',  errId:'errRoomPrice',  required:true, pattern:/^\d+(\.\d{1,2})?$/, patternMsg:'Только число' },
  ]);
  if (!ok) return;

  const number = document.getElementById('roomNumber').value.trim();
  const type   = document.getElementById('roomType').value;
  const price  = Number(document.getElementById('roomPrice').value);
  const status = document.getElementById('roomStatus').value;
  const note   = document.getElementById('roomNote').value.trim() || null;

  try {
    if (_editRoomId) {
      await DB.updateRoom({ id:_editRoomId, number, type, price, status, note });
      toast.success(`Номер №${number} обновлён`);
    } else {
      await DB.addRoom({ number, type, price, status, note });
      toast.success(`Номер №${number} добавлен`);
    }
    modal.close('roomModal');
    renderRooms();
  } catch (e) {
    if (e.message.includes('уже существует')) {
      document.getElementById('roomNumber').classList.add('error');
      document.getElementById('errRoomNumber').textContent = e.message;
    } else toast.error(e.message);
  }
}

async function openDeleteRoom(id) {
  const room = _allRooms.find(r => r.id === id);
  if (!room) return;
  _deleteRoomId = id;
  document.getElementById('deleteRoomText').textContent =
    `Номер №${room.number} (${room.type}) будет удалён безвозвратно.`;
  modal.open('deleteRoomModal');
}

async function confirmDeleteRoom() {
  try {
    await DB.deleteRoom(_deleteRoomId);
    toast.success('Номер удалён');
    modal.close('deleteRoomModal');
    renderRooms();
  } catch (e) { toast.error(e.message); }
}

document.addEventListener('DOMContentLoaded', renderRooms);
