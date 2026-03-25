// ==============================
// STATE
// ==============================
let todos = [];
let templates = [];
let currentFilter = 'all';

// ==============================
// KHỞI ĐỘNG
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  loadTodos();
  loadTemplates();
  renderTodos();
  renderTemplates();
  bindEvents();
  updateCurrentDate();
});

// ==============================
// LOCALSTORAGE
// ==============================
function loadTodos() {
  try {
    const saved = localStorage.getItem('todos');
    todos = saved ? JSON.parse(saved) : [];
  } catch {
    todos = [];
  }
}

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function loadTemplates() {
  try {
    const saved = localStorage.getItem('todo-templates');
    templates = saved ? JSON.parse(saved) : [];
  } catch {
    templates = [];
  }
}

function saveTemplates() {
  localStorage.setItem('todo-templates', JSON.stringify(templates));
}

// ==============================
// CRUD - TODOS
// ==============================
function addTodo(text, dueDate = '') {
  const trimmed = text.trim();
  if (!trimmed) return;

  const newTodo = {
    id: Date.now(),
    text: trimmed,
    done: false,
    dueDate: dueDate || '',
    createdAt: new Date().toISOString()
  };

  todos.unshift(newTodo);
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map(t =>
    t.id === id ? { ...t, done: !t.done } : t
  );
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  const item = document.querySelector(`[data-id="${id}"]`);
  if (item) {
    item.style.transition = 'opacity 0.2s, transform 0.2s';
    item.style.opacity = '0';
    item.style.transform = 'translateX(20px)';
    setTimeout(() => {
      todos = todos.filter(t => t.id !== id);
      saveTodos();
      renderTodos();
    }, 200);
  } else {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
  }
}

function clearDoneTodos() {
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
}

// ==============================
// CRUD - TEMPLATES
// ==============================
function addTemplate(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (templates.includes(trimmed)) return; // tránh trùng lặp

  templates.push(trimmed);
  saveTemplates();
  renderTemplates();
}

function deleteTemplate(index) {
  templates.splice(index, 1);
  saveTemplates();
  renderTemplates();
}

function applyTemplates() {
  if (templates.length === 0) return;

  const now = new Date();
  // Ngày đầu tháng sau
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const yyyy = nextMonth.getFullYear();
  const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');

  let added = 0;
  templates.forEach(text => {
    const newTodo = {
      id: Date.now() + Math.random(),
      text: text,
      done: false,
      dueDate: `${yyyy}-${mm}-01`,
      createdAt: new Date().toISOString()
    };
    todos.unshift(newTodo);
    added++;
  });

  saveTodos();
  renderTodos();
  showToast(`✅ Đã tạo ${added} công việc cho tháng ${mm}/${yyyy}!`);
}

// ==============================
// RENDER - TODOS
// ==============================
function getFilteredTodos() {
  switch (currentFilter) {
    case 'done':    return todos.filter(t => t.done);
    case 'pending': return todos.filter(t => !t.done);
    default:        return todos;
  }
}

function renderTodos() {
  const list = document.getElementById('todo-list');
  const emptyState = document.getElementById('empty-state');
  const actionsBar = document.getElementById('actions-bar');
  const filtered = getFilteredTodos();

  list.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    filtered.forEach(todo => {
      list.appendChild(createTodoItem(todo));
    });
  }

  const hasDone = todos.some(t => t.done);
  actionsBar.style.display = hasDone ? 'block' : 'none';

  updateStats();
}

function createTodoItem(todo) {
  const li = document.createElement('li');
  li.className = `todo-item${todo.done ? ' done' : ''}`;
  li.dataset.id = todo.id;
  li.setAttribute('role', 'listitem');

  const createdDate = formatDate(todo.createdAt);
  const dueDateHtml = todo.dueDate
    ? `<span class="todo-due ${isOverdue(todo.dueDate) && !todo.done ? 'overdue' : ''}">📅 Hạn: ${formatDateStr(todo.dueDate)}</span>`
    : '';

  li.innerHTML = `
    <div class="todo-check" aria-label="${todo.done ? 'Hoàn thành' : 'Chưa xong'}">
      ${todo.done ? '✓' : ''}
    </div>
    <div class="todo-body">
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <div class="todo-meta">
        <span class="todo-created">🕐 ${createdDate}</span>
        ${dueDateHtml}
      </div>
    </div>
    <button class="btn-delete" aria-label="Xóa việc này" title="Xóa">✕</button>
  `;

  li.addEventListener('click', (e) => {
    if (!e.target.closest('.btn-delete')) {
      toggleTodo(todo.id);
    }
  });

  li.querySelector('.btn-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTodo(todo.id);
  });

  return li;
}

// ==============================
// RENDER - TEMPLATES
// ==============================
function renderTemplates() {
  const list = document.getElementById('template-list');
  const emptyMsg = document.getElementById('template-empty');
  const applyBtn = document.getElementById('btn-apply-templates');

  list.innerHTML = '';

  if (templates.length === 0) {
    emptyMsg.style.display = 'block';
    applyBtn.disabled = true;
  } else {
    emptyMsg.style.display = 'none';
    applyBtn.disabled = false;
    templates.forEach((text, index) => {
      const li = document.createElement('li');
      li.className = 'template-item';
      li.innerHTML = `
        <span class="template-text">${escapeHtml(text)}</span>
        <button class="btn-template-delete" data-index="${index}" title="Xóa mẫu">✕</button>
      `;
      li.querySelector('.btn-template-delete').addEventListener('click', () => deleteTemplate(index));
      list.appendChild(li);
    });
  }
}

// ==============================
// STATS & UI
// ==============================
function updateStats() {
  const total   = todos.length;
  const done    = todos.filter(t => t.done).length;
  const pending = total - done;

  document.getElementById('stat-total').textContent   = `${total} công việc`;
  document.getElementById('stat-done').textContent    = `${done} hoàn thành`;
  document.getElementById('stat-pending').textContent = `${pending} còn lại`;
}

function updateCurrentDate() {
  const el = document.getElementById('current-date');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleDateString('vi-VN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==============================
// EVENTS
// ==============================
function bindEvents() {
  // Submit todo form
  document.getElementById('todo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input   = document.getElementById('todo-input');
    const dueInput = document.getElementById('due-date-input');
    addTodo(input.value, dueInput ? dueInput.value : '');
    input.value = '';
    if (dueInput) dueInput.value = '';
    input.focus();
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTodos();
    });
  });

  // Clear done
  document.getElementById('btn-clear-done').addEventListener('click', () => {
    if (confirm('Xóa tất cả công việc đã hoàn thành?')) {
      clearDoneTodos();
    }
  });

  // Template form
  document.getElementById('template-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('template-input');
    addTemplate(input.value);
    input.value = '';
    input.focus();
  });

  // Apply templates button
  document.getElementById('btn-apply-templates').addEventListener('click', () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
    const yyyy = nextMonth.getFullYear();
    if (confirm(`Tạo ${templates.length} công việc cố định cho tháng ${mm}/${yyyy}?`)) {
      applyTemplates();
    }
  });

  // Toggle template panel
  document.getElementById('btn-toggle-templates').addEventListener('click', () => {
    const panel = document.getElementById('template-panel');
    panel.classList.toggle('open');
    const btn = document.getElementById('btn-toggle-templates');
    btn.textContent = panel.classList.contains('open') ? '📋 Ẩn mẫu' : '📋 Mẫu hàng tháng';
  });
}

// ==============================
// UTILS
// ==============================
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateStr(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return due < today;
}
