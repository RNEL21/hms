/* ── Booking Modal — переиспользуемый модуль ────────────── */
/* Подключается на dashboard.html и bookings.html              */
/* Экспортирует: initBookingModal(), openAddBooking()          */
/* Опциональный callback: BookingModal.onCreated = (booking) => {} */

const BookingModal = (() => {
  let _fpCheckIn = null, _fpCheckOut = null;
  let _selectedGuestId = null;
  let _newGuestMode = false;
  let _guestSearchTimer = null;
  let _searchResultsCache = [];
  let _initialized = false;

  const MODAL_HTML = `
<div id="bookingModal" class="modal-overlay">
  <div class="modal" style="max-width:580px;">
    <div class="modal-header">
      <span class="modal-title">Новое бронирование</span>
      <button class="modal-close" onclick="modal.close('bookingModal')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Гость *</label>
        <input class="form-input" id="guestSearch" placeholder="Поиск по имени, телефону, паспорту..." autocomplete="off">
        <div class="guest-search-results" id="guestSearchResults" style="display:none;"></div>
        <div id="selectedGuestBox" style="display:none;"></div>
        <div class="form-error" id="errBookingGuest"></div>
        <div class="new-guest-toggle" onclick="BookingModal.toggleNewGuestForm()">
          <span id="newGuestToggleText">＋ Или добавить нового гостя</span>
        </div>
        <div class="new-guest-block" id="newGuestBlock">
          <div class="form-group">
            <label class="form-label">ФИО *</label>
            <input class="form-input" id="newGuestName" placeholder="Иванов Иван Иванович">
            <div class="form-error" id="errNewGuestName"></div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Телефон</label>
              <input class="form-input" id="newGuestPhone" placeholder="+7 924 000-00-00">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" id="newGuestEmail" type="email" placeholder="email@mail.ru">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Серия и номер паспорта *</label>
            <input class="form-input" id="newGuestPassport" placeholder="2507 842156">
            <div class="form-error" id="errNewGuestPassport"></div>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Свободный номер *</label>
        <select class="form-input form-select" id="bookingRoom">
          <option value="">— выберите номер —</option>
        </select>
        <div class="form-error" id="errBookingRoom"></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Дата заезда *</label>
          <input class="form-input" id="bookingCheckIn" placeholder="ДД.ММ.ГГГГ" readonly>
          <div class="form-error" id="errCheckIn"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Дата выезда *</label>
          <input class="form-input" id="bookingCheckOut" placeholder="ДД.ММ.ГГГГ" readonly>
          <div class="form-error" id="errCheckOut"></div>
        </div>
      </div>
      <div id="pricePreview" class="card" style="display:none;padding:14px 18px;text-align:center;">
        <span style="color:var(--text-3);font-size:.83rem;">Стоимость</span>
        <div class="num" id="priceVal" style="font-size:1.5rem;font-weight:800;color:var(--accent);margin-top:4px;"></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="modal.close('bookingModal')">Отмена</button>
        <button class="btn btn-primary" onclick="BookingModal.saveBooking()">Создать бронь</button>
      </div>
    </div>
  </div>
</div>`;

  /* ── Инициализация: вставка HTML + flatpickr ─────────── */
  function init() {
    if (_initialized) return;
    // Вставляем модалку в конец body, если её ещё нет
    if (!document.getElementById('bookingModal')) {
      document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
    }
    _initialized = true;

    // Инициализируем flatpickr для полей даты
    _fpCheckIn = flatpickr('#bookingCheckIn', {
      dateFormat: 'Y-m-d', altInput: true, altFormat: 'd.m.Y', locale: 'ru', minDate: 'today',
      onChange(dates) {
        if (dates[0] && _fpCheckOut) _fpCheckOut.set('minDate', dates[0]);
        calcPrice();
      }
    });
    _fpCheckOut = flatpickr('#bookingCheckOut', {
      dateFormat: 'Y-m-d', altInput: true, altFormat: 'd.m.Y', locale: 'ru', minDate: 'today',
      onChange() { calcPrice(); }
    });

    // Инициализируем маски для телефона и паспорта
    IMask(document.getElementById('newGuestPhone'), {
      mask: '+{7} 000 000-00-00',
      lazy: true
    });
    IMask(document.getElementById('newGuestPassport'), {
      mask: '0000 000000',
      lazy: true
    });

    // Слушатель поиска гостя
    document.getElementById('guestSearch')?.addEventListener('input', e => onGuestSearchInput(e.target.value));
    // Слушатель смены номера → пересчёт цены
    document.getElementById('bookingRoom')?.addEventListener('change', calcPrice);

    // Применяем mousedown-guard к вставленной модалке
    const ov = document.getElementById('bookingModal');
    if (ov) {
      let downOnOverlay = false;
      ov.addEventListener('mousedown', e => { downOnOverlay = (e.target === ov); });
      ov.addEventListener('click', e => {
        if (downOnOverlay && e.target === ov) modal.closeAll();
        downOnOverlay = false;
      });
    }
  }

  /* ── Поиск гостя ─────────────────────────────────────── */
  async function searchGuests(query) {
    const results = document.getElementById('guestSearchResults');
    if (!query.trim()) { results.style.display = 'none'; results.innerHTML = ''; return; }

    try {
      const guests = await DB.getGuests(query.trim());
      _searchResultsCache = guests;
      if (!guests.length) {
        results.innerHTML = '<div class="guest-search-empty">Гости не найдены</div>';
        results.style.display = 'block';
        return;
      }
      results.innerHTML = guests.map((g, i) => `
        <div class="guest-search-item" onclick="BookingModal.selectGuestByIdx(${i})">
          <div class="gs-name">${utils.escapeHtml(g.name)}</div>
          <div class="gs-info">${utils.escapeHtml(g.phone) || ''} ${g.phone && g.passport_number ? '·' : ''} ${utils.escapeHtml(g.passport_number) || ''}</div>
        </div>`).join('');
      results.style.display = 'block';
    } catch (e) { toast.error(e.message); }
  }

  function onGuestSearchInput(val) {
    clearTimeout(_guestSearchTimer);
    _guestSearchTimer = setTimeout(() => searchGuests(val), 250);
  }

  function selectGuestByIdx(idx) {
    const g = _searchResultsCache[idx];
    if (!g) return;
    _selectedGuestId = g.id;
    _newGuestMode = false;
    closeNewGuestForm();

    document.getElementById('guestSearch').value = '';
    document.getElementById('guestSearchResults').style.display = 'none';

    const box = document.getElementById('selectedGuestBox');
    box.innerHTML = `
      <div class="guest-selected-box">
        <div>
          <div class="gs-name">${utils.escapeHtml(g.name)}</div>
          <div class="gs-info">${utils.escapeHtml(g.phone) || ''} ${g.phone && g.passport_number ? '·' : ''} ${utils.escapeHtml(g.passport_number) || ''}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="BookingModal.clearGuestSelection()">✕</button>
      </div>`;
    box.style.display = 'block';
    document.getElementById('errBookingGuest').textContent = '';
  }

  function clearGuestSelection() {
    _selectedGuestId = null;
    document.getElementById('selectedGuestBox').style.display = 'none';
    document.getElementById('selectedGuestBox').innerHTML = '';
  }

  /* ── Инлайн-форма нового гостя ────────────────────────── */
  function toggleNewGuestForm() {
    _newGuestMode = !_newGuestMode;
    const block = document.getElementById('newGuestBlock');
    const toggleText = document.getElementById('newGuestToggleText');
    if (_newGuestMode) {
      block.classList.add('open');
      toggleText.textContent = '✕ Отмена (вернуться к поиску)';
      clearGuestSelection();
      document.getElementById('guestSearchResults').style.display = 'none';
      document.getElementById('guestSearch').value = '';
    } else {
      closeNewGuestForm();
    }
  }

  function closeNewGuestForm() {
    _newGuestMode = false;
    document.getElementById('newGuestBlock')?.classList.remove('open');
    const tt = document.getElementById('newGuestToggleText');
    if (tt) tt.textContent = '＋ Или добавить нового гостя';
    ['newGuestName', 'newGuestPhone', 'newGuestEmail', 'newGuestPassport']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['errNewGuestName', 'errNewGuestPassport']
      .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
  }

  /* ── Открытие модалки ────────────────────────────────── */
  async function open(preselectRoomId) {
    if (!_initialized) init();

    try {
      const rooms = await DB.getRooms();
      const free = rooms.filter(r => r.status === 'свободен' && !r.needs_cleaning);

      document.getElementById('bookingRoom').innerHTML =
        '<option value="">— выберите номер —</option>' +
        free.map(r =>
          `<option value="${r.id}" data-price="${r.price}">
             №${utils.escapeHtml(r.number)} — ${utils.escapeHtml(r.type)} — ${Number(r.price).toLocaleString('ru-RU')} ₽/ночь
           </option>`).join('');

      if (preselectRoomId) {
        const roomOpt = [...document.getElementById('bookingRoom').options]
          .find(o => o.value === String(preselectRoomId));
        if (roomOpt) document.getElementById('bookingRoom').value = String(preselectRoomId);
      }

      // Сброс гостя
      _selectedGuestId = null;
      _newGuestMode = false;
      document.getElementById('guestSearch').value = '';
      document.getElementById('guestSearchResults').style.display = 'none';
      document.getElementById('selectedGuestBox').style.display = 'none';
      closeNewGuestForm();

      _fpCheckIn?.clear(); _fpCheckOut?.clear();
      if (_fpCheckOut) _fpCheckOut.set('minDate', 'today');
      document.getElementById('pricePreview').style.display = 'none';
      ['errBookingGuest', 'errBookingRoom', 'errCheckIn', 'errCheckOut']
        .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
      modal.open('bookingModal');
    } catch (e) { toast.error(e.message); }
  }

  /* ── Расчёт цены ─────────────────────────────────────── */
  function calcPrice() {
    const ci = _fpCheckIn?.selectedDates[0];
    const co = _fpCheckOut?.selectedDates[0];
    const sel = document.getElementById('bookingRoom');
    const opt = sel?.options[sel.selectedIndex];
    const price = opt ? Number(opt.dataset.price) : 0;
    const wrap = document.getElementById('pricePreview');
    if (!ci || !co || !price) { wrap.style.display = 'none'; return; }
    const days = Math.round((co - ci) / 86400000);
    if (days <= 0) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    document.getElementById('priceVal').textContent =
      `${(days * price).toLocaleString('ru-RU')} ₽ · ${days} ночей × ${price.toLocaleString('ru-RU')} ₽`;
  }

  /* ── Сохранение брони ────────────────────────────────── */
  async function saveBooking() {
    const roomId = document.getElementById('bookingRoom').value;
    const checkIn = document.getElementById('bookingCheckIn').value;
    const checkOut = document.getElementById('bookingCheckOut').value;

    let ok = true;
    [['bookingRoom', 'errBookingRoom', 'Выберите номер'],
    ['bookingCheckIn', 'errCheckIn', 'Выберите дату заезда'],
    ['bookingCheckOut', 'errCheckOut', 'Выберите дату выезда']]
      .forEach(([id, errId, msg]) => {
        const el = document.getElementById(id);
        const err = document.getElementById(errId);
        if (!el.value) { if (err) err.textContent = msg; ok = false; }
        else { if (err) err.textContent = ''; }
      });

    const errGuest = document.getElementById('errBookingGuest');
    if (_newGuestMode) {
      const name = document.getElementById('newGuestName').value.trim();
      const passport = document.getElementById('newGuestPassport').value.trim();
      let guestOk = true;
      if (!name) {
        document.getElementById('errNewGuestName').textContent = 'Обязательное поле';
        guestOk = false;
      } else { document.getElementById('errNewGuestName').textContent = ''; }
      if (!passport) {
        document.getElementById('errNewGuestPassport').textContent = 'Обязательное поле';
        guestOk = false;
      } else if (!/^\d{4}\s\d{6}$/.test(passport)) {
        document.getElementById('errNewGuestPassport').textContent = 'Формат: 2507 842156';
        guestOk = false;
      } else { document.getElementById('errNewGuestPassport').textContent = ''; }
      if (!guestOk) ok = false;
    } else if (!_selectedGuestId) {
      if (errGuest) errGuest.textContent = 'Выберите гостя или добавьте нового';
      ok = false;
    } else {
      if (errGuest) errGuest.textContent = '';
    }

    if (!ok) return;

    if (checkOut <= checkIn) {
      document.getElementById('errCheckOut').textContent = 'Выезд должен быть позже заезда';
      return;
    }

    try {
      let body = { room_id: +roomId, check_in: checkIn, check_out: checkOut };
      if (_newGuestMode) {
        body.new_guest = {
          name: document.getElementById('newGuestName').value.trim(),
          phone: document.getElementById('newGuestPhone').value.trim(),
          email: document.getElementById('newGuestEmail').value.trim(),
          passport_number: document.getElementById('newGuestPassport').value.trim(),
        };
      } else {
        body.guest_id = _selectedGuestId;
      }

      const result = await DB.addBooking(body);
      toast.success('Бронирование создано');
      modal.close('bookingModal');
      // Вызываем callback, если определён (страница может переопределить поведение)
      if (typeof BookingModal.onCreated === 'function') BookingModal.onCreated(result);
    } catch (e) { toast.error(e.message); }
  }

  return {
    init,
    open,
    saveBooking,
    calcPrice,
    searchGuests,
    onGuestSearchInput,
    selectGuestByIdx,
    clearGuestSelection,
    toggleNewGuestForm,
    closeNewGuestForm,
    onCreated: null,
  };
})();
