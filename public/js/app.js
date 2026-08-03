/* ── Theme ─────────────────────────────────────────────── */
const theme = {
  init() {
    const saved = localStorage.getItem('hms-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    this._setIcon(saved);
  },
  toggle() {
    const cur  = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('hms-theme', next);
    this._setIcon(next);
  },
  _setIcon(t) {
    const icon = t === 'dark' ? 'sun' : 'moon';
    // sidebar theme btn
    ['themeBtn', 'mobThemeIcon'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const target = el.tagName === 'BUTTON' ? el.querySelector('i') : el;
      if (target) { target.setAttribute('data-lucide', icon); lucide?.createIcons(); }
    });
  }
};

/* ── Sidebar (mobile drawer) ───────────────────────────── */
const sidebar = {
  open() {
    document.getElementById('mobSidebar')?.classList.add('open');
    document.getElementById('mobOverlay')?.classList.add('open');
    // лэндинг — старый sidebar
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  },
  close() {
    document.getElementById('mobSidebar')?.classList.remove('open');
    document.getElementById('mobOverlay')?.classList.remove('open');
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }
};

/* ── Modal ─────────────────────────────────────────────── */
const modal = {
  open(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => el.querySelector('input, select')?.focus(), 80);
  },
  close(id) {
    document.getElementById(id)?.classList.remove('open');
    document.body.style.overflow = '';
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }
};

/* ── Toast ─────────────────────────────────────────────── */
const toast = {
  _show(text, bg) {
    Toastify({
      text, duration: 3000, gravity: 'bottom', position: 'right',
      style: { background: bg, borderRadius: '8px',
               fontFamily: "'Golos Text', sans-serif" }
    }).showToast();
  },
  success(msg) { this._show('✓  ' + msg, 'var(--success)'); },
  error(msg)   { this._show('✕  ' + msg, 'var(--danger)');  },
  warn(msg)    { this._show('⚠  ' + msg, 'var(--warn-text)'); }
};

/* ── Form validation ───────────────────────────────────── */
function validateForm(rules) {
  let ok = true;
  rules.forEach(({ id, errId, required, minLen, pattern, patternMsg }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el) return;
    const val = el.value.trim();
    let msg = '';
    if (required && !val)                          msg = 'Обязательное поле';
    else if (minLen && val.length < minLen)        msg = `Минимум ${minLen} символов`;
    else if (pattern && !pattern.test(val) && val) msg = patternMsg || 'Неверный формат';
    el.classList.toggle('error', !!msg);
    if (err) err.textContent = msg;
    if (msg) ok = false;
  });
  return ok;
}

/* ── Utils ─────────────────────────────────────────────── */
const utils = {
  nextId: arr => arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1,

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  statusBadge(status) {
    const map = {
      'активна':   'badge-success',
      'свободен':  'badge-success',
      'отменена':  'badge-danger',
      'занят':     'badge-danger',
      'завершена': 'badge-warn',
    };
    return `<span class="badge ${map[status] || 'badge-accent'}">${status}</span>`;
  },

  today() {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth()+1).padStart(2,'0'),
      String(d.getDate()).padStart(2,'0')
    ].join('-');
  },

  formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const months = ['января','февраля','марта','апреля','мая','июня',
      'июля','августа','сентября','октября','ноября','декабря'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  },

  empty(container, msg = 'Ничего не найдено') {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-text">${msg}</div>
      </div>`;
  }
};

/* ── Logout ───────────────────────────────────────────── */
async function doLogout() {
  try { await apiFetch('/api/auth/logout', { method:'POST' }); } catch {}
  window.location.href = 'login.html';
}

/* ── Global init ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  theme.init();
  // Инициализируем Lucide иконки
  if (typeof lucide !== 'undefined') lucide.createIcons();

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { modal.closeAll(); sidebar.close(); }
  });
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    let downOnOverlay = false;
    ov.addEventListener('mousedown', e => {
      downOnOverlay = (e.target === ov);
    });
    ov.addEventListener('click', e => {
      if (downOnOverlay && e.target === ov) modal.closeAll();
      downOnOverlay = false;
    });
  });
});