document.addEventListener('DOMContentLoaded', async () => {

  /* ── Инициализация модалки бронирования ──────────────── */
  BookingModal.init();
  // После создания брони на дашборде → редирект на страницу бронирований
  BookingModal.onCreated = () => {
    setTimeout(() => { window.location.href = 'bookings.html'; }, 600);
  };

  /* ── Дата в шапке ──────────────────────────────────────── */
  const dateEl = document.getElementById('todayDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }

  const today = utils.today();
  let lineChartInstance = null;
  let donutChartInstance = null;

  try {
    /* ── Данные из API ───────────────────────────────────── */
    const [stats, bookings, rooms] = await Promise.all([
      DB.getStats(),
      DB.getBookings(),
      DB.getRooms(),
    ]);

    /* ── Занятость ───────────────────────────────────────── */
    document.getElementById('occTotal').textContent = stats.total;
    document.getElementById('occFree').textContent  = stats.free;
    document.getElementById('occBusy').textContent  = stats.busy;

    const freePct = stats.total ? Math.round(stats.free / stats.total * 100) : 0;
    const busyPct = 100 - freePct;
    document.getElementById('occBarFree').style.width = freePct + '%';
    document.getElementById('occBarBusy').style.width = busyPct + '%';

    /* ── Бронирования ────────────────────────────────────── */
    const active   = bookings.filter(b => b.status === 'активна');
    const checkIns = active.filter(b => b.check_in  === today);
    const checkOuts= active.filter(b => b.check_out === today);

    document.getElementById('bkActive').textContent = active.length;
    document.getElementById('bkIn').textContent     = checkIns.length;
    document.getElementById('bkOut').textContent    = checkOuts.length;

    /* ── Алерт выездов ───────────────────────────────────── */
    if (checkOuts.length) {
      const names = checkOuts.map(b => utils.escapeHtml(b.guest_name)).join(', ');
      const alert = document.getElementById('checkoutAlert');
      const text  = document.getElementById('checkoutText');
      if (alert && text) {
        alert.style.display = 'flex';
        text.innerHTML =
          `<strong>Сегодня выезжают ${checkOuts.length} гост(ей):</strong> ${names}`;
      }
    }

    /* ── Последние бронирования ──────────────────────────── */
    const tbody = document.getElementById('recentBookings');
    if (tbody) {
      const recent = [...bookings].slice(0, 6);
      tbody.innerHTML = recent.length
        ? recent.map(b => `
            <tr>
              <td><strong>${utils.escapeHtml(b.guest_name)}</strong></td>
              <td class="num" style="font-weight:700;">№${utils.escapeHtml(b.room_number)}</td>
              <td style="color:var(--text-2);">${utils.escapeHtml(b.room_type)}</td>
              <td style="color:var(--text-2);">${utils.formatDate(b.check_in)}</td>
              <td style="color:var(--text-2);">${utils.formatDate(b.check_out)}</td>
              <td>${utils.statusBadge(b.status)}</td>
            </tr>`).join('')
        : `<tr><td colspan="6"
               style="text-align:center;padding:36px;color:var(--text-3);">
               Нет бронирований
             </td></tr>`;
    }

    /* ── Charts ──────────────────────────────────────────── */
    const isDark  = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridClr = isDark ? 'rgba(255,244,232,.06)' : 'rgba(43,29,22,.06)';
    const lblClr  = isDark ? '#9F8A77' : '#9A7E6B';
    const accent  = isDark ? '#E76F00' : '#D95F18';
    const accentFill = isDark
      ? 'rgba(231,111,0,.15)'
      : 'rgba(217,95,24,.10)';

    /* Line chart */
    const lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
      lineChartInstance = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: ['Янв','Фев','Мар','Апр','Май','Июн'],
          datasets: [{
            label: 'Бронирований',
            data: [4, 7, 5, 9, 12, bookings.length],
            borderColor:     accent,
            backgroundColor: accentFill,
            borderWidth: 2.5,
            tension: .4,
            fill: true,
            pointBackgroundColor: accent,
            pointRadius: 4,
            pointHoverRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridClr }, ticks: { color: lblClr } },
            y: { grid: { color: gridClr }, ticks: { color: lblClr, stepSize: 1 } }
          }
        }
      });
    }

    /* Donut chart — типы номеров */
    const typeMap = {};
    rooms.forEach(r => typeMap[r.type] = (typeMap[r.type] || 0) + 1);

    const donutColors = isDark
      ? ['#E76F00','#63C174','#F4B942','#E06B5A']
      : ['#D95F18','#4D8B55','#D9A441','#C45C4A'];

    const donutCtx = document.getElementById('donutChart');
    if (donutCtx) {
      donutChartInstance = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(typeMap),
          datasets: [{
            data: Object.values(typeMap),
            backgroundColor: donutColors,
            borderColor: isDark ? '#241B15' : '#fff',
            borderWidth: 3,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: lblClr,
                padding: 16,
                font: { size: 12 },
                usePointStyle: true,
              }
            }
          },
          cutout: '65%',
        }
      });
    }

    /* ── Явный ресайз графиков (не полагаемся на внутренний ResizeObserver) ── */
    const chartWraps = document.querySelectorAll('.chart-canvas-wrap');
    if (chartWraps.length && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        lineChartInstance?.resize();
        donutChartInstance?.resize();
      });
      chartWraps.forEach(w => ro.observe(w));
    }
    // Fallback: debounce на window resize (покрывает зум Ctrl+/- в ряде браузеров)
    let _resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(() => {
        lineChartInstance?.resize();
        donutChartInstance?.resize();
      }, 180);
    });

    /* Перерисовываем Charts при смене темы */
    document.addEventListener('click', e => {
      const btn = e.target.closest('#themeBtn, .mob-link');
      if (btn && (btn.id === 'themeBtn' || btn.querySelector('[data-lucide="moon"], [data-lucide="sun"]'))) {
        setTimeout(() => location.reload(), 220);
      }
    });

  } catch (e) {
    console.error(e);
    toast.error('Ошибка загрузки данных');
  }

});

/* ── Обёртка для кнопки "Новое бронирование" ──────────── */
function openAddBooking(preselectRoomId) {
  BookingModal.open(preselectRoomId);
}
