/* ====================================================
   NoteFlow — Full Frontend Application
   Base URL: http://localhost:4900
   ==================================================== */

const API = 'http://localhost:4900';
const NOTE_COLORS = ['#58A6FF','#3FB950','#D29922','#BC8CFF','#F78166','#39C5CF'];

// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────
const state = {
  user: null,
  token: null,
  notes: [],
  filteredNotes: [],
  searchQuery: '',
  view: 'grid',          // 'grid' | 'list'
  activeFilter: 'all',   // 'all' | 'recent'
  selectedNote: null,
  isLoading: false,
};

// ─────────────────────────────────────────────
//  COOKIE HELPERS
// ─────────────────────────────────────────────
function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Strict`;
}
function getCookie(name) {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, null);
}
function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// ─────────────────────────────────────────────
//  API HELPERS
// ─────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  try {
    const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...(options.headers||{}) } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
    return data;
  } catch (err) {
    if (err.name === 'TypeError') throw new Error('Cannot connect to server. Is it running?');
    throw err;
  }
}

// ─────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────
function toast(msg, type = 'info') {
  const icons = { info: '💡', success: '✅', error: '❌', warning: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]||'💡'}</span><span>${msg}</span>`;
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  container.appendChild(el);
  setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 320); }, 3500);
}

// ─────────────────────────────────────────────
//  RENDER ROOT
// ─────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  if (state.token && state.user) {
    app.innerHTML = renderDashboard();
    bindDashboard();
  } else {
    app.innerHTML = renderLogin();
    bindAuth();
  }
}

// ─────────────────────────────────────────────
//  AUTH PAGES
// ─────────────────────────────────────────────
function renderLogin() {
  return `
  <div class="auth-page">
    <div class="auth-bg"></div>
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-logo">📝</div>
        <h1>Welcome back</h1>
        <p>Sign in to your NoteFlow workspace</p>
      </div>
      <div id="auth-error" class="form-error" style="display:none;margin-bottom:14px;justify-content:center;"></div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <div class="input-icon-wrap">
          <span class="input-icon">✉️</span>
          <input class="form-input" id="login-email" type="email" placeholder="you@example.com" autocomplete="email" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <div class="input-icon-wrap">
          <span class="input-icon">🔒</span>
          <input class="form-input" id="login-password" type="password" placeholder="••••••••" autocomplete="current-password" />
        </div>
      </div>
      <button class="btn btn-primary" id="btn-login" style="width:100%;justify-content:center;padding:11px;">
        Sign In
      </button>
      <div class="auth-footer">
        Don't have an account? <span class="auth-link" id="go-register">Create one</span>
      </div>
    </div>
  </div>`;
}

function renderRegister() {
  return `
  <div class="auth-page">
    <div class="auth-bg"></div>
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-logo">✨</div>
        <h1>Create account</h1>
        <p>Start organizing your ideas today</p>
      </div>
      <div id="auth-error" class="form-error" style="display:none;margin-bottom:14px;justify-content:center;"></div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input class="form-input" id="reg-name" type="text" placeholder="Ali Ahmed" />
        </div>
        <div class="form-group">
          <label class="form-label">Role</label>
          <select class="form-input form-select" id="reg-role">
            <option value="writer">Writer</option> 
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <div class="input-icon-wrap">
          <span class="input-icon">✉️</span>
          <input class="form-input" id="reg-email" type="email" placeholder="you@example.com" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <div class="input-icon-wrap">
          <span class="input-icon">🔒</span>
          <input class="form-input" id="reg-password" type="password" placeholder="Min 6 characters" />
        </div>
      </div>
      <button class="btn btn-primary" id="btn-register" style="width:100%;justify-content:center;padding:11px;">
        Create Account
      </button>
      <div class="auth-footer">
        Already have an account? <span class="auth-link" id="go-login">Sign in</span>
      </div>
    </div>
  </div>`;
}

function bindAuth() {
  // Login
  const btnLogin = document.getElementById('btn-login');
  if (btnLogin) {
    btnLogin.addEventListener('click', handleLogin);
    document.getElementById('login-password')?.addEventListener('keydown', e => e.key === 'Enter' && handleLogin());
    document.getElementById('go-register')?.addEventListener('click', () => {
      document.getElementById('app').innerHTML = renderRegister();
      bindAuth();
    });
  }
  // Register
  const btnReg = document.getElementById('btn-register');
  if (btnReg) {
    btnReg.addEventListener('click', handleRegister);
    document.getElementById('go-login')?.addEventListener('click', () => {
      document.getElementById('app').innerHTML = renderLogin();
      bindAuth();
    });
  }
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('auth-error');
  const btn = document.getElementById('btn-login');
  if (!email || !password) { showAuthError('Please fill in all fields.'); return; }
  btn.innerHTML = '<span class="loading-spinner"></span> Signing in…';
  btn.disabled = true;
  try {
    const data = await apiFetch('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    state.token = data.token;
    state.user  = { name: data.name, role: data.role };
    setCookie('nf_token', data.token);
    setCookie('nf_user', JSON.stringify({ name: data.name, role: data.role }));
    toast(`Welcome back, ${data.name}! 👋`, 'success');
    await loadNotes();
    render();
  } catch (err) {
    showAuthError(err.message);
    btn.innerHTML = 'Sign In';
    btn.disabled = false;
  }
}

async function handleRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role     = document.getElementById('reg-role').value;
  const btn = document.getElementById('btn-register');
  if (!name || !email || !password) { showAuthError('Please fill in all fields.'); return; }
  if (password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }
  btn.innerHTML = '<span class="loading-spinner"></span> Creating…';
  btn.disabled = true;
  try {
    await apiFetch('/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) });
    toast('Account created! Please sign in.', 'success');
    document.getElementById('app').innerHTML = renderLogin();
    bindAuth();
  } catch (err) {
    showAuthError(err.message);
    btn.innerHTML = 'Create Account';
    btn.disabled = false;
  }
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.style.display = 'flex'; el.innerHTML = `❌ ${msg}`; }
}

// ─────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────
function renderDashboard() {
  const notes = state.filteredNotes;
  const total = state.notes.length;
  const recent = state.notes.filter(n => {
    const d = new Date(n.lastchange || n.updatedAt);
    return (Date.now() - d) < 7 * 24 * 3600 * 1000;
  }).length;

  return `
  <div class="app-shell">
    ${renderSidebar(total, recent)}
    <div class="main-content">
      ${renderTopbar()}
      <div class="notes-area" id="notes-area">
        <div class="notes-stats">
          <div class="stat-card accent">
            <div class="stat-value" id="stat-total">${total}</div>
            <div class="stat-label">Total Notes</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value" id="stat-recent">${recent}</div>
            <div class="stat-label">This Week</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">${state.user?.name?.split(' ')[0] || '—'}</div>
            <div class="stat-label">Logged in as</div>
          </div>
        </div>
        <div class="section-header">
          <span class="section-title">
            ${state.activeFilter === 'all' ? 'All Notes' : 'Recent Notes'}
            ${state.searchQuery ? ` — "${state.searchQuery}"` : ''}
          </span>
          <div class="view-toggle">
            <button class="view-btn ${state.view==='grid'?'active':''}" id="btn-grid" title="Grid view">▦</button>
            <button class="view-btn ${state.view==='list'?'active':''}" id="btn-list" title="List view">☰</button>
          </div>
        </div>
        ${state.isLoading ? renderLoader() : renderNotesGrid(notes)}
      </div>
    </div>
  </div>`;
}

function renderSidebar(total, recent) {
  return `
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <div class="logo-icon">📝</div>
        <span class="logo-text">NoteFlow</span>
      </div>
      <div class="user-card">
        <div class="user-avatar">${(state.user?.name||'?')[0].toUpperCase()}</div>
        <div class="user-info">
          <div class="user-name">${state.user?.name || 'User'}</div>
          <div class="user-role">${state.user?.role || 'writer'}</div>
        </div>
      </div>
    </div>
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input class="search-input" id="search-input" type="text" placeholder="Search notes…" value="${state.searchQuery}" />
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Library</div>
      <button class="nav-item ${state.activeFilter==='all'?'active':''}" id="filter-all">
        📋 All Notes <span class="count">${total}</span>
      </button>
      <button class="nav-item ${state.activeFilter==='recent'?'active':''}" id="filter-recent">
        🕒 Recent <span class="count">${recent}</span>
      </button>
    </nav>
    <div class="sidebar-footer">
      <button class="btn-logout" id="btn-logout">🚪 Sign Out</button>
    </div>
  </aside>`;
}

function renderTopbar() {
  return `
  <div class="topbar">
    <div class="topbar-left">
      <h1>My Workspace</h1>
      <p>${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
    </div>
    <div class="topbar-actions">
      <button class="btn btn-primary" id="btn-add-note">
        ✏️ New Note
      </button>
    </div>
  </div>`;
}

function renderLoader() {
  return `<div class="page-loader"><div class="loading-spinner"></div><span>Loading notes…</span></div>`;
}

function renderNotesGrid(notes) {
  if (!notes.length) return renderEmpty();
  const cards = notes.map((n, i) => renderNoteCard(n, i)).join('');
  return `<div class="notes-grid ${state.view==='list'?'list-view':''}" id="notes-grid">${cards}</div>`;
}

function renderNoteCard(note, idx) {
  const color = NOTE_COLORS[idx % NOTE_COLORS.length];
  const ago = timeAgo(note.lastchange || note.updatedAt);
  const q = state.searchQuery.toLowerCase();
  const title   = q ? highlight(esc(note.title), q) : esc(note.title);
  const content = q ? highlight(esc(note.content), q) : esc(note.content);
  return `
  <div class="note-card" data-id="${note._id}" style="--card-accent:${color}">
    ${state.view === 'list' ? `
      <div class="note-card-body">
        <div class="note-card-header">
          <div>
            <div class="note-title">${title}</div>
            <div class="note-content">${content}</div>
          </div>
          <div class="note-actions">
            <button class="btn btn-ghost btn-icon btn-sm btn-edit" data-id="${note._id}" title="Edit">✏️</button>
            <button class="btn btn-danger btn-icon btn-sm btn-delete" data-id="${note._id}" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    ` : `
      <div class="note-card-header">
        <div class="note-title">${title}</div>
        <div class="note-actions">
          <button class="btn btn-ghost btn-icon btn-sm btn-edit" data-id="${note._id}" title="Edit">✏️</button>
          <button class="btn btn-danger btn-icon btn-sm btn-delete" data-id="${note._id}" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="note-content">${content}</div>
      <div class="note-footer">
        <span class="note-date">🕒 ${ago}</span>
        <span class="note-badge">note</span>
      </div>
    `}
  </div>`;
}

function renderEmpty() {
  const isSearch = !!state.searchQuery;
  return `
  <div class="empty-state">
    <div class="empty-icon">${isSearch ? '🔍' : '📭'}</div>
    <h3>${isSearch ? 'No results found' : 'No notes yet'}</h3>
    <p>${isSearch ? `Nothing matches "${state.searchQuery}"` : 'Create your first note to get started'}</p>
    ${!isSearch ? `<button class="btn btn-primary" id="btn-add-note-empty">✏️ Create Note</button>` : ''}
  </div>`;
}

// ─────────────────────────────────────────────
//  BIND DASHBOARD EVENTS
// ─────────────────────────────────────────────
function bindDashboard() {
  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', handleLogout);

  // Filters
  document.getElementById('filter-all')?.addEventListener('click', () => {
    state.activeFilter = 'all';
    applyFilters();
    rerenderContent();
  });
  document.getElementById('filter-recent')?.addEventListener('click', () => {
    state.activeFilter = 'recent';
    applyFilters();
    rerenderContent();
  });

  // Search
  const searchInput = document.getElementById('search-input');
  let debounceTimer;
  searchInput?.addEventListener('input', e => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.searchQuery = e.target.value;
      applyFilters();
      rerenderContent();
    }, 200);
  });

  // View toggle
  document.getElementById('btn-grid')?.addEventListener('click', () => { state.view = 'grid'; rerenderContent(); });
  document.getElementById('btn-list')?.addEventListener('click', () => { state.view = 'list'; rerenderContent(); });

  // Add note
  document.getElementById('btn-add-note')?.addEventListener('click', showAddModal);

  // Note cards
  document.getElementById('notes-grid')?.addEventListener('click', handleNoteClick);
  document.getElementById('btn-add-note-empty')?.addEventListener('click', showAddModal);
}

function handleNoteClick(e) {
  const editBtn   = e.target.closest('.btn-edit');
  const deleteBtn = e.target.closest('.btn-delete');
  const card      = e.target.closest('.note-card');
  if (editBtn)   { e.stopPropagation(); showEditModal(editBtn.dataset.id); return; }
  if (deleteBtn) { e.stopPropagation(); confirmDelete(deleteBtn.dataset.id); return; }
  if (card)      { showNoteDetail(card.dataset.id); }
}

function rerenderContent() {
  const area = document.getElementById('notes-area');
  if (!area) return;
  area.innerHTML = `
    <div class="notes-stats">
      <div class="stat-card accent">
        <div class="stat-value">${state.notes.length}</div>
        <div class="stat-label">Total Notes</div>
      </div>
      <div class="stat-card success">
        <div class="stat-value">${state.notes.filter(n=>(Date.now()-new Date(n.lastchange||n.updatedAt))<7*24*3600*1000).length}</div>
        <div class="stat-label">This Week</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">${state.user?.name?.split(' ')[0]||'—'}</div>
        <div class="stat-label">Logged in as</div>
      </div>
    </div>
    <div class="section-header">
      <span class="section-title">
        ${state.activeFilter==='all'?'All Notes':'Recent Notes'}
        ${state.searchQuery?` — "${state.searchQuery}"`:''} 
      </span>
      <div class="view-toggle">
        <button class="view-btn ${state.view==='grid'?'active':''}" id="btn-grid">▦</button>
        <button class="view-btn ${state.view==='list'?'active':''}" id="btn-list">☰</button>
      </div>
    </div>
    ${renderNotesGrid(state.filteredNotes)}
  `;
  document.getElementById('btn-grid')?.addEventListener('click', () => { state.view = 'grid'; rerenderContent(); });
  document.getElementById('btn-list')?.addEventListener('click', () => { state.view = 'list'; rerenderContent(); });
  document.getElementById('notes-grid')?.addEventListener('click', handleNoteClick);
  document.getElementById('btn-add-note-empty')?.addEventListener('click', showAddModal);
}

// ─────────────────────────────────────────────
//  NOTES CRUD
// ─────────────────────────────────────────────
async function loadNotes() {
  state.isLoading = true;
  try {
    const data = await apiFetch('/notes/');
    state.notes = data.data || [];
    applyFilters();
  } catch (err) {
    toast(err.message, 'error');
    state.notes = [];
    state.filteredNotes = [];
  }
  state.isLoading = false;
}

function applyFilters() {
  let notes = [...state.notes];
  if (state.activeFilter === 'recent') {
    notes = notes.filter(n => (Date.now() - new Date(n.lastchange||n.updatedAt)) < 7*24*3600*1000);
  }
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    notes = notes.filter(n =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }
  // Sort newest first
  notes.sort((a,b) => new Date(b.lastchange||b.updatedAt) - new Date(a.lastchange||a.updatedAt));
  state.filteredNotes = notes;
}

// ─────────────────────────────────────────────
//  MODALS — ADD / EDIT
// ─────────────────────────────────────────────
function showAddModal() {
  openModal({
    title: '✏️ New Note',
    body: noteFormHTML(),
    onSave: async () => {
      const title   = document.getElementById('note-title').value.trim();
      const content = document.getElementById('note-content').value.trim();
      if (!title || !content) { toast('Title and content are required.', 'warning'); return false; }
      try {
        const data = await apiFetch('/notes/add', {
          method: 'POST',
          body: JSON.stringify({ title, content })
        });
        state.notes.unshift(data.add);
        applyFilters();
        rerenderContent();
        toast('Note created! 🎉', 'success');
        return true;
      } catch (err) { toast(err.message, 'error'); return false; }
    }
  });
  bindNoteForm();
}

function showEditModal(id) {
  const note = state.notes.find(n => n._id === id);
  if (!note) return;
  openModal({
    title: '✏️ Edit Note',
    body: noteFormHTML(note),
    onSave: async () => {
      const title   = document.getElementById('note-title').value.trim();
      const content = document.getElementById('note-content').value.trim();
      if (!title || !content) { toast('Title and content are required.', 'warning'); return false; }
      try {
        const data = await apiFetch(`/notes/edit/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ title, content })
        });
        const idx = state.notes.findIndex(n => n._id === id);
        if (idx > -1) state.notes[idx] = data.data;
        applyFilters();
        rerenderContent();
        toast('Note updated! ✨', 'success');
        return true;
      } catch (err) { toast(err.message, 'error'); return false; }
    }
  });
  bindNoteForm();
}

function noteFormHTML(note = null) {
  return `
    <div class="form-group">
      <label class="form-label">Title</label>
      <input class="form-input" id="note-title" type="text" placeholder="Give your note a title…" maxlength="120" value="${note ? esc(note.title) : ''}" />
      <div class="char-counter"><span id="title-count">${note?.title?.length||0}</span>/120</div>
    </div>
    <div class="form-group">
      <label class="form-label">Content</label>
      <textarea class="form-textarea" id="note-content" placeholder="Start writing your thoughts here…" maxlength="5000">${note ? esc(note.content) : ''}</textarea>
      <div class="char-counter"><span id="content-count">${note?.content?.length||0}</span>/5000</div>
    </div>
  `;
}

function bindNoteForm() {
  document.getElementById('note-title')?.addEventListener('input', e => {
    document.getElementById('title-count').textContent = e.target.value.length;
  });
  document.getElementById('note-content')?.addEventListener('input', e => {
    document.getElementById('content-count').textContent = e.target.value.length;
  });
  setTimeout(() => document.getElementById('note-title')?.focus(), 100);
}

// ─────────────────────────────────────────────
//  DELETE CONFIRM
// ─────────────────────────────────────────────
function confirmDelete(id) {
  const note = state.notes.find(n => n._id === id);
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" style="max-width:380px">
      <div class="confirm-icon">🗑️</div>
      <div class="confirm-text">
        <h3>Delete Note</h3>
        <p>Are you sure you want to delete <strong>"${esc(note?.title||'this note')}"</strong>? This cannot be undone.</p>
      </div>
      <div class="modal-footer" style="justify-content:center">
        <button class="btn btn-ghost" id="cancel-delete">Cancel</button>
        <button class="btn btn-danger" id="confirm-delete-btn">Delete Note</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  document.getElementById('cancel-delete').addEventListener('click', () => backdrop.remove());
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
    const btn = document.getElementById('confirm-delete-btn');
    btn.innerHTML = '<span class="loading-spinner"></span>';
    btn.disabled = true;
    try {
      await apiFetch(`/notes/delete/${id}`, { method: 'DELETE' });
      state.notes = state.notes.filter(n => n._id !== id);
      applyFilters();
      rerenderContent();
      toast('Note deleted.', 'info');
      backdrop.remove();
    } catch (err) { toast(err.message, 'error'); btn.innerHTML = 'Delete Note'; btn.disabled = false; }
  });
}

// ─────────────────────────────────────────────
//  NOTE DETAIL PANEL
// ─────────────────────────────────────────────
function showNoteDetail(id) {
  const note = state.notes.find(n => n._id === id);
  if (!note) return;
  document.querySelector('.note-detail')?.remove();
  document.querySelector('.detail-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'detail-overlay';
  const panel = document.createElement('div');
  panel.className = 'note-detail';
  panel.innerHTML = `
    <div class="note-detail-header">
      <div class="badge badge-accent">📋 Note</div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm btn-icon" id="detail-edit" title="Edit">✏️</button>
        <button class="btn btn-danger btn-sm btn-icon" id="detail-delete" title="Delete">🗑️</button>
        <button class="btn btn-ghost btn-sm btn-icon" id="detail-close" title="Close">✕</button>
      </div>
    </div>
    <div class="note-detail-title">${esc(note.title)}</div>
    <div class="note-detail-meta">
      <span>📅 Created ${formatDate(note.timeofcreation || note.createdAt)}</span>
      <span>🔄 Updated ${timeAgo(note.lastchange || note.updatedAt)}</span>
    </div>
    <div class="note-detail-content">${esc(note.content)}</div>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(panel);
  overlay.addEventListener('click', closeDetail);
  panel.querySelector('#detail-close').addEventListener('click', closeDetail);
  panel.querySelector('#detail-edit').addEventListener('click', () => { closeDetail(); showEditModal(id); });
  panel.querySelector('#detail-delete').addEventListener('click', () => { closeDetail(); confirmDelete(id); });
}

function closeDetail() {
  document.querySelector('.note-detail')?.remove();
  document.querySelector('.detail-overlay')?.remove();
}

// ─────────────────────────────────────────────
//  GENERIC MODAL
// ─────────────────────────────────────────────
function openModal({ title, body, onSave }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="modal-close" id="modal-close">✕</button>
      </div>
      <div id="modal-body">${body}</div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-save">Save Note</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  document.getElementById('modal-close').addEventListener('click', close);
  document.getElementById('modal-cancel').addEventListener('click', close);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });

  document.getElementById('modal-save').addEventListener('click', async () => {
    const btn = document.getElementById('modal-save');
    btn.innerHTML = '<span class="loading-spinner"></span> Saving…';
    btn.disabled = true;
    const ok = await onSave();
    if (ok) close();
    else { btn.innerHTML = 'Save Note'; btn.disabled = false; }
  });
}

// ─────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────
async function handleLogout() {
  try {
    await apiFetch('/logout', { method: 'POST' });
  } catch (_) { /* ignore */ }
  state.token = null;
  state.user  = null;
  state.notes = [];
  state.filteredNotes = [];
  deleteCookie('nf_token');
  deleteCookie('nf_user');
  toast('Signed out successfully.', 'info');
  render();
}

// ─────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function highlight(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="highlight">$1</mark>');
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr);
  const secs = Math.floor(diff / 1000);
  if (secs < 60)  return 'just now';
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs/86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
async function init() {
  const token = getCookie('nf_token');
  const userCookie = getCookie('nf_user');
  if (token && userCookie) {
    try {
      state.token = token;
      state.user = JSON.parse(userCookie);
      await loadNotes();
    } catch (_) {
      state.token = null;
      state.user  = null;
    }
  }
  render();
}

init();