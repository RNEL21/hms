let _editGuestId   = null;
let _deleteGuestId = null;
let _scanFilePath  = '';

async function renderGuests() {
  const search = document.getElementById('searchGuest')?.value.trim() || '';
  try {
    const guests = await DB.getGuests(search);
    const count  = document.getElementById('guestCount');
    if (count) count.textContent = `(${guests.length})`;

    const tbody = document.getElementById('guestsBody');
    if (!guests.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:48px;color:var(--text-3);">
        <div style="font-size:2rem;margin-bottom:8px;">🔍</div>Гости не найдены</td></tr>`;
      return;
    }
    tbody.innerHTML = guests.map((g, i) => `
      <tr>
        <td class="num" style="color:var(--text-3);font-weight:700;">${i+1}</td>
        <td>
          <div style="font-weight:600;">${utils.escapeHtml(g.name)}</div>
          ${g.email ? `<div style="font-size:.8rem;color:var(--text-3);">${utils.escapeHtml(g.email)}</div>` : ''}
        </td>
        <td style="color:var(--text-2);">${utils.escapeHtml(g.phone) || '—'}</td>
        <td class="mono">${utils.escapeHtml(g.passport_number) || '—'}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="openEditGuest(${g.id})">✏️</button>
            <button class="btn btn-icon btn-sm"
              style="background:var(--danger-glass);color:var(--danger);"
              onclick="openDeleteGuest(${g.id})">🗑️</button>
          </div>
        </td>
      </tr>`).join('');
  } catch (e) { toast.error(e.message); }
}

function openAddGuest() {
  _editGuestId = null; _scanFilePath = '';
  document.getElementById('guestModalTitle').textContent = 'Новый гость';
  ['guestId','guestName','guestPhone','guestEmail','guestPassport']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('scanPathLabel').textContent = 'файл не выбран';
  document.getElementById('scanInput').value = '';
  modal.open('guestModal');
}

async function openEditGuest(id) {
  try {
    const guests = await DB.getGuests();
    const g = guests.find(g => g.id === id);
    if (!g) return;
    _editGuestId = id; _scanFilePath = g.passport_scan || '';
    document.getElementById('guestModalTitle').textContent = `Редактировать — ${g.name}`;
    document.getElementById('guestId').value       = g.id;
    document.getElementById('guestName').value     = g.name;
    document.getElementById('guestPhone').value    = g.phone           || '';
    document.getElementById('guestEmail').value    = g.email           || '';
    document.getElementById('guestPassport').value = g.passport_number || '';
    document.getElementById('scanPathLabel').textContent = g.passport_scan || 'файл не выбран';
    modal.open('guestModal');
  } catch (e) { toast.error(e.message); }
}

function handleScan(input) {
  const file = input.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().match(/\.jpe?g$/)) {
    document.getElementById('errGuestScan').textContent = 'Разрешены только .jpg файлы';
    input.value = ''; return;
  }
  document.getElementById('errGuestScan').textContent = '';
  _scanFilePath = file.name;
  document.getElementById('scanPathLabel').textContent = file.name;
}

async function saveGuest() {
  const ok = validateForm([
    { id:'guestName',     errId:'errGuestName',     required:true, minLen:2 },
    { id:'guestPassport', errId:'errGuestPassport', required:true,
      pattern:/^\d{4}\s\d{6}$/, patternMsg:'Формат: 2507 842156' },
    { id:'guestEmail',    errId:'errGuestEmail',    required:false,
      pattern:/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMsg:'Неверный email' },
  ]);
  if (!ok) return;

  const guest = {
    name:            document.getElementById('guestName').value.trim(),
    phone:           document.getElementById('guestPhone').value.trim(),
    email:           document.getElementById('guestEmail').value.trim(),
    passport_number: document.getElementById('guestPassport').value.trim(),
    passport_scan:   _scanFilePath,
  };
  try {
    if (_editGuestId) {
      await DB.updateGuest({ ...guest, id: _editGuestId });
      toast.success(`${guest.name} обновлён`);
    } else {
      await DB.addGuest(guest);
      toast.success(`${guest.name} добавлен`);
    }
    modal.close('guestModal');
    renderGuests();
  } catch (e) { toast.error(e.message); }
}

async function openDeleteGuest(id) {
  const guests = await DB.getGuests();
  const g = guests.find(g => g.id === id);
  if (!g) return;
  _deleteGuestId = id;
  document.getElementById('deleteGuestText').textContent =
    `Гость «${g.name}» будет удалён безвозвратно.`;
  modal.open('deleteGuestModal');
}

async function confirmDeleteGuest() {
  try {
    await DB.deleteGuest(_deleteGuestId);
    toast.success('Гость удалён');
    modal.close('deleteGuestModal');
    renderGuests();
  } catch (e) { toast.error(e.message); }
}

document.addEventListener('DOMContentLoaded', () => {
  renderGuests();
  IMask(document.getElementById('guestPhone'), {
    mask: '+{7} 000 000-00-00',
    lazy: true
  });
  IMask(document.getElementById('guestPassport'), {
    mask: '0000 000000',
    lazy: true
  });
});
