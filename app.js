// ==============================
// STATE
// ==============================
let todos = [];
let currentFilter = 'all';

// ==============================
// KHỞI ĐỘNG
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  loadTodos();
  renderTodos();
  bindEvents();
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

// ==============================
// CRUD
// ==============================
function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const newTodo = {
    id: Date.now(),
    text: trimmed,
    done: false,
    createdAt: new Date().toISOString()
  };

  todos.unshift(newTodo); // Thêm vào đầu danh sách
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
// RENDER
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

  // Clear list
  list.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    filtered.forEach(todo => {
      list.appendChild(createTodoItem(todo));
    });
  }

  // Hiển thị nút "Xóa tất cả đã xong"
  const hasDone = todos.some(t => t.done);
  actionsBar.style.display = hasDone ? 'block' : 'none';

  updateStats();
}

function createTodoItem(todo) {
  const li = document.createElement('li');
  li.className = `todo-item${todo.done ? ' done' : ''}`;
  li.dataset.id = todo.id;
  li.setAttribute('role', 'listitem');

  li.innerHTML = `
    <div class="todo-check" aria-label="${todo.done ? 'Hoàn thành' : 'Chưa xong'}">
      ${todo.done ? '✓' : ''}
    </div>
    <span class="todo-text">${escapeHtml(todo.text)}</span>
    <button class="btn-delete" aria-label="Xóa việc này" title="Xóa">✕</button>
  `;

  // Click vào item để toggle (trừ nút xóa)
  li.addEventListener('click', (e) => {
    if (!e.target.closest('.btn-delete')) {
      toggleTodo(todo.id);
    }
  });

  // Click nút xóa
  li.querySelector('.btn-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTodo(todo.id);
  });

  return li;
}

// ==============================
// STATS
// ==============================
function updateStats() {
  const total   = todos.length;
  const done    = todos.filter(t => t.done).length;
  const pending = total - done;

  document.getElementById('stat-total').textContent =
    `${total} công việc`;
  document.getElementById('stat-done').textContent =
    `${done} hoàn thành`;
  document.getElementById('stat-pending').textContent =
    `${pending} còn lại`;
}

// ==============================
// EVENTS
// ==============================
function bindEvents() {
  // Submit form
  document.getElementById('todo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('todo-input');
    addTodo(input.value);
    input.value = '';
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
}

// ==============================
// UTILS
// ==============================
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
