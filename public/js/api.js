/* ── Обёртка над fetch ─────────────────────────────────── */
async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    credentials: 'include',
    ...opts,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401 && !url.startsWith('/api/auth/')) {
    window.location.href = 'login.html';
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

/* ── DB — единый интерфейс (был mock, теперь API) ─────── */
const DB = {

  /* Rooms */
  getRooms:         ()             => apiFetch('/api/rooms'),
  addRoom:          (r)            => apiFetch('/api/rooms',       { method:'POST',   body: r }),
  updateRoom:        ({ id, ...r }) => apiFetch(`/api/rooms/${id}`, { method:'PUT',    body: r }),
  deleteRoom:       (id)           => apiFetch(`/api/rooms/${id}`, { method:'DELETE' }),
  markRoomCleaned:  (id)           => apiFetch(`/api/rooms/${id}/cleaning`, { method:'PATCH', body: { needs_cleaning: false } }),
  setRoomNeedsClean:(id)           => apiFetch(`/api/rooms/${id}/cleaning`, { method:'PATCH', body: { needs_cleaning: true } }),

  /* Guests */
  getGuests:   (search = '') => apiFetch(`/api/guests${search ? '?search='+encodeURIComponent(search) : ''}`),
  addGuest:    (g)             => apiFetch('/api/guests',       { method:'POST',   body: g }),
  updateGuest: ({ id, ...g }) => apiFetch(`/api/guests/${id}`,  { method:'PUT',    body: g }),
  deleteGuest: (id)            => apiFetch(`/api/guests/${id}`,  { method:'DELETE' }),

  /* Bookings */
  getBookings:   ()   => apiFetch('/api/bookings'),
  addBooking:    (b)  => apiFetch('/api/bookings',            { method:'POST', body: b }),
  cancelBooking: (id) => apiFetch(`/api/bookings/${id}/cancel`,{ method:'PUT' }),

  /* Stats */
  getStats: () => apiFetch('/api/bookings/stats'),
};
