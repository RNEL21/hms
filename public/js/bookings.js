let _cancelBookingId = null;
let _fpRange = null;
let _dateFrom = null, _dateTo = null;

/* ── Инициализация Flatpickr для фильтра дат ───────────── */
function initFlatpickr() {
  _fpRange = flatpickr('#dateRange', {
    mode:'range', dateFormat:'Y-m-d', locale:'ru', allowInput:false,
    onChange(dates) {
      if (dates.length === 2) {
        _dateFrom = dates[0]; _dateTo = dates[1];
        document.getElementById('clearDate').style.display = 'inline-flex';
        renderBookings();
      }
    }
  });
}

function clearDateFilter() {
  _fpRange?.clear(); _dateFrom = null; _dateTo = null;
  document.getElementById('clearDate').style.display = 'none';
  renderBookings();
}

/* ── Рендер таблицы бронирований ───────────────────────── */
async function renderBookings() {
  const search = document.getElementById('searchBooking')?.value.trim().toLowerCase() || '';
  const status = document.getElementById('filterStatus')?.value || '';
  try {
    let bookings = await DB.getBookings();
    if (search) bookings = bookings.filter(b =>
      b.guest_name.toLowerCase().includes(search) ||
      b.room_number.toLowerCase().includes(search));
    if (status) bookings = bookings.filter(b => b.status === status);

    // Фильтр по диапазону дат (ISO-строки сравниваются корректно)
    if (_dateFrom && _dateTo) {
      const from = isoStr(_dateFrom), to = isoStr(_dateTo);
      bookings = bookings.filter(b => b.check_in <= to && b.check_out >= from);
    }

    const count = document.getElementById('bookingCount');
    if (count) count.textContent = `(${bookings.length})`;

    const today = utils.today();
    const tbody = document.getElementById('bookingsBody');

    if (!bookings.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:48px;color:var(--text-3);">
        <div style="font-size:2rem;margin-bottom:8px;">📅</div>Бронирования не найдены</td></tr>`;
      return;
    }
    tbody.innerHTML = bookings.map(b => {
      const isOut = b.check_out === today && b.status === 'активна';
      return `<tr style="${isOut ? 'background:var(--warn-glass);' : ''}">
        <td class="num" style="color:var(--text-3);font-weight:700;">${b.id}</td>
        <td><div style="font-weight:600;">${utils.escapeHtml(b.guest_name || '—')}</div>
          ${isOut ? '<div style="font-size:.75rem;color:var(--warn-text);font-weight:600;">⚠ Выезд сегодня</div>' : ''}
        </td>
        <td class="num" style="font-weight:700;">№${utils.escapeHtml(b.room_number)}</td>
        <td style="color:var(--text-2);">${utils.escapeHtml(b.room_type)}</td>
        <td style="color:var(--text-2);">${utils.formatDate(b.check_in)}</td>
        <td style="color:var(--text-2);">${utils.formatDate(b.check_out)}</td>
        <td>${utils.statusBadge(b.status)}</td>
        <td>${b.status === 'активна'
          ? `<button class="btn btn-sm" style="background:var(--danger-glass);color:var(--danger);"
               onclick="openCancelBooking(${b.id})">❌ Отменить</button>`
          : `<span style="color:var(--text-3);font-size:.82rem;">—</span>`}
        </td>
      </tr>`;
    }).join('');
  } catch (e) { toast.error(e.message); }
}

/* ── Проверка выездов сегодня ──────────────────────────── */
async function checkCheckouts() {
  try {
    const today    = utils.today();
    const bookings = await DB.getBookings();
    const outs     = bookings.filter(b => b.check_out === today && b.status === 'активна');
    const alert    = document.getElementById('checkoutAlert');
    if (!alert || !outs.length) return;
    const names = outs.map(b => `<strong>${utils.escapeHtml(b.guest_name)}</strong> (№${utils.escapeHtml(b.room_number)})`).join(', ');
    alert.style.display = 'flex';
    document.getElementById('checkoutText').innerHTML = `Сегодня выезжают: ${names}`;
  } catch (_) {}
}

/* ── Отмена бронирования ───────────────────────────────── */
async function openCancelBooking(id) {
  const bookings = await DB.getBookings();
  const b = bookings.find(b => b.id === id);
  if (!b) return;
  _cancelBookingId = id;
  document.getElementById('cancelBookingText').textContent =
    `Бронь ${b.guest_name} (№${b.room_number}, ${utils.formatDate(b.check_in)} – ${utils.formatDate(b.check_out)}) будет отменена.`;
  modal.open('cancelBookingModal');
}

async function confirmCancelBooking() {
  try {
    await DB.cancelBooking(_cancelBookingId);
    toast.warn('Бронирование отменено');
    modal.close('cancelBookingModal');
    checkCheckouts();
    renderBookings();
  } catch (e) { toast.error(e.message); }
}

/* ── Обёртки для совместимости с существующими onclick ─── */
function openAddBooking(preselectRoomId) { BookingModal.open(preselectRoomId); }
function saveBooking() { BookingModal.saveBooking(); }

/* ── Утилиты ───────────────────────────────────────────── */
function isoStr(date) {
  if (typeof date === 'string') return date;
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

document.addEventListener('DOMContentLoaded', () => {
  BookingModal.init();
  initFlatpickr();
  checkCheckouts();
  renderBookings();

  // После создания брони из модалки — обновить таблицу и алерт
  BookingModal.onCreated = () => {
    checkCheckouts();
    renderBookings();
  };

  // Предзаполнение номера из URL (?room=ID)
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  if (roomId) BookingModal.open(parseInt(roomId, 10));
});
