/**
 * app.js – StudyMate
 * ──────────────────
 * Main application logic: task management, rendering,
 * filtering, searching, sorting, and dashboard updates.
 *
 * Requires: storage.js (loaded first via <script> in index.html)
 */

/* ============================================================
   CONSTANTS & STATE
   ============================================================ */

/** Priority order for sorting (high = 1, medium = 2, low = 3) */
const PRIORITY_ORDER = { high: 1, medium: 2, low: 3 };

/** Motivational quotes shown in the sidebar footer */
const QUOTES = [
  'Keep going! You\'ve got this! 💪',
  'One task at a time. You\'re doing great! 📚',
  'Success is the sum of small efforts. ✨',
  'Study hard today, shine tomorrow! 🌟',
  'Every completed task is a step forward! 🚀',
  'Believe in yourself and your progress! 🎯',
];

/** Application state – holds current filter, sort, and search values */
const state = {
  filter:     'all',   // 'all' | 'pending' | 'completed'
  sort:       'due',   // 'due' | 'priority' | 'created'
  search:     '',      // search query string
  editingId:  null,    // id of task currently being edited (null = add mode)
  deleteId:   null,    // id of task pending deletion confirmation
};

/* ============================================================
   DOM REFERENCES
   Declared as `let` here; assigned inside init() once the DOM
   is guaranteed to be fully ready. This eliminates any timing
   risk when the page is opened via file:// protocol.
   ============================================================ */

// Navigation
let navDashboard, navTasks, pageDashboard, pageTasks;

// Mobile sidebar
let hamburgerBtn, sidebar, sidebarOverlay;

// Buttons that open the Add Task modal
let sidebarAddBtn, tasksPageAddBtn, mobileAddBtn;

// Dashboard elements
let todayDate, statTotal, statPending, statCompleted, statPercent;
let progressBarFill, progressBarWrap, progressValue;
let todayTasksList, allDoneMessage, motivationalQuote;

// Task page
let searchInput, filterSelect, sortSelect, taskList, filterTabs;
let clearCompletedBtn;

// Modal
let modalBackdrop, modalTitle, modalClose, cancelModalBtn;
let taskForm, saveTaskBtn;

// Form fields
let taskTitleInput, taskSubjectSelect, taskSubjectInput;
let taskDueDateInput, taskDescriptionInput, taskIdHidden;

// Error spans
let titleError, subjectError, dateError, priorityError;

// Delete dialog
let deleteBackdrop, deleteTaskName, confirmDeleteBtn, cancelDeleteBtn;

// Toast
let toastContainer;

/* ============================================================
   INITIALISATION
   ============================================================ */

/**
 * init()
 * Called once when the DOM is guaranteed to be ready.
 * Step 1: Resolve all DOM element references.
 * Step 2: Attach all event listeners.
 * Step 3: Render the initial view.
 */
function init() {
  // ── Step 1: Resolve DOM references now that the DOM is ready ──
  navDashboard   = document.getElementById('navDashboard');
  navTasks       = document.getElementById('navTasks');
  pageDashboard  = document.getElementById('pageDashboard');
  pageTasks      = document.getElementById('pageTasks');

  hamburgerBtn   = document.getElementById('hamburgerBtn');
  sidebar        = document.getElementById('sidebar');
  sidebarOverlay = document.getElementById('sidebarOverlay');

  sidebarAddBtn   = document.getElementById('sidebarAddBtn');
  tasksPageAddBtn = document.getElementById('tasksPageAddBtn');
  mobileAddBtn    = document.getElementById('mobileAddBtn');

  todayDate       = document.getElementById('todayDate');
  statTotal       = document.getElementById('statTotal');
  statPending     = document.getElementById('statPending');
  statCompleted   = document.getElementById('statCompleted');
  statPercent     = document.getElementById('statPercent');
  progressBarFill = document.getElementById('progressBarFill');
  progressBarWrap = document.getElementById('progressBarWrap');
  progressValue   = document.getElementById('progressValue');
  todayTasksList  = document.getElementById('todayTasksList');
  allDoneMessage  = document.getElementById('allDoneMessage');
  motivationalQuote = document.getElementById('motivationalQuote');

  searchInput     = document.getElementById('searchInput');
  filterSelect    = document.getElementById('filterSelect');
  sortSelect      = document.getElementById('sortSelect');
  taskList        = document.getElementById('taskList');
  filterTabs      = document.querySelectorAll('.filter-tab');
  clearCompletedBtn = document.getElementById('clearCompletedBtn');

  modalBackdrop   = document.getElementById('modalBackdrop');
  modalTitle      = document.getElementById('modalTitle');
  modalClose      = document.getElementById('modalClose');
  cancelModalBtn  = document.getElementById('cancelModalBtn');
  taskForm        = document.getElementById('taskForm');
  saveTaskBtn     = document.getElementById('saveTaskBtn');

  taskTitleInput       = document.getElementById('taskTitle');
  taskSubjectSelect    = document.getElementById('taskSubjectSelect');
  taskSubjectInput     = document.getElementById('taskSubject');
  taskDueDateInput     = document.getElementById('taskDueDate');
  taskDescriptionInput = document.getElementById('taskDescription');
  taskIdHidden         = document.getElementById('taskId');

  titleError    = document.getElementById('titleError');
  subjectError  = document.getElementById('subjectError');
  dateError     = document.getElementById('dateError');
  priorityError = document.getElementById('priorityError');

  deleteBackdrop   = document.getElementById('deleteBackdrop');
  deleteTaskName   = document.getElementById('deleteTaskName');
  confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  cancelDeleteBtn  = document.getElementById('cancelDeleteBtn');

  toastContainer = document.getElementById('toastContainer');

  // ── Step 2 & 3 ──
  displayTodayDate();
  showRandomQuote();
  attachEventListeners();
  renderAll();
}

/** Display today's date in a friendly format */
function displayTodayDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  todayDate.textContent = now.toLocaleDateString('en-US', options);
}

/** Pick and display a random motivational quote */
function showRandomQuote() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  motivationalQuote.textContent = q;
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */

/**
 * attachEventListeners()
 * Registers all UI event handlers in one place.
 * Each element is null-checked before wiring so that a single
 * missing element cannot silently abort ALL listener registration.
 */
function attachEventListeners() {

  // ── Navigation ──
  if (navDashboard) navDashboard.addEventListener('click', () => switchPage('dashboard'));
  if (navTasks)     navTasks.addEventListener('click',     () => switchPage('tasks'));

  // ── Mobile sidebar toggle ──
  if (hamburgerBtn)   hamburgerBtn.addEventListener('click',   openSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  // ── Open Add Task modal (three entry points) ──
  if (sidebarAddBtn)   sidebarAddBtn.addEventListener('click',   () => openModal());
  if (tasksPageAddBtn) tasksPageAddBtn.addEventListener('click', () => openModal());
  if (mobileAddBtn)    mobileAddBtn.addEventListener('click',    () => openModal());

  // ── Modal close ──
  if (modalClose)     modalClose.addEventListener('click',     closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
  if (modalBackdrop)  modalBackdrop.addEventListener('click',  (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  // ── Close modal / delete-dialog on Escape key ──
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalBackdrop  && modalBackdrop.classList.contains('open'))  closeModal();
      if (deleteBackdrop && deleteBackdrop.classList.contains('open')) closeDeleteDialog();
    }
  });

  // ── Subject dropdown — show/hide custom text input ──
  if (taskSubjectSelect) {
    taskSubjectSelect.addEventListener('change', () => {
      if (taskSubjectSelect.value === 'custom') {
        taskSubjectInput.classList.remove('hidden');
        taskSubjectInput.focus();
      } else {
        taskSubjectInput.classList.add('hidden');
        taskSubjectInput.value = '';
      }
    });
  }

  // ── FORM SUBMIT — this is the core save handler ──
  if (taskForm) {
    taskForm.addEventListener('submit', handleFormSubmit);
  } else {
    console.error('StudyMate: taskForm element not found — Save Task will not work!');
  }

  // ── Real-time search ──
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      state.search = searchInput.value.trim();
      renderTaskList();
    });
  }

  // ── Filter dropdown ──
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      state.filter = filterSelect.value;
      syncFilterTabs();
      renderTaskList();
    });
  }

  // ── Sort dropdown ──
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      renderTaskList();
    });
  }

  // ── Filter tabs ──
  if (filterTabs) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        state.filter = tab.dataset.filter;
        if (filterSelect) filterSelect.value = state.filter;
        syncFilterTabs();
        renderTaskList();
      });
    });
  }

  // ── Clear completed tasks ──
  if (clearCompletedBtn) clearCompletedBtn.addEventListener('click', handleClearCompleted);

  // ── Delete confirmation dialog ──
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
  if (cancelDeleteBtn)  cancelDeleteBtn.addEventListener('click',  closeDeleteDialog);
  if (deleteBackdrop) {
    deleteBackdrop.addEventListener('click', (e) => {
      if (e.target === deleteBackdrop) closeDeleteDialog();
    });
  }
}

/* ============================================================
   PAGE NAVIGATION
   ============================================================ */

/**
 * switchPage(page)
 * Shows the selected page and updates nav button styles.
 * @param {string} page – 'dashboard' | 'tasks'
 */
function switchPage(page) {
  pageDashboard.classList.toggle('active', page === 'dashboard');
  pageTasks.classList.toggle('active',     page === 'tasks');

  navDashboard.classList.toggle('active', page === 'dashboard');
  navDashboard.setAttribute('aria-current', page === 'dashboard' ? 'page' : 'false');
  navTasks.classList.toggle('active',     page === 'tasks');
  navTasks.setAttribute('aria-current', page === 'tasks' ? 'page' : 'false');

  if (page === 'dashboard') renderDashboard();
  if (page === 'tasks')     renderTaskList();

  closeSidebar(); // auto-close on mobile
}

/* ============================================================
   SIDEBAR (MOBILE)
   ============================================================ */

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
  sidebarOverlay.removeAttribute('aria-hidden');
  hamburgerBtn.setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
  sidebarOverlay.setAttribute('aria-hidden', 'true');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
}

/* ============================================================
   MODAL – ADD / EDIT TASK
   ============================================================ */

/**
 * openModal(task)
 * Opens the task form modal.
 * If `task` is provided, pre-fills the form for editing.
 * @param {Object|null} task – Task to edit, or null for a new task
 */
function openModal(task = null) {
  resetForm();
  state.editingId = task ? task.id : null;

  if (task) {
    // Edit mode – fill fields
    modalTitle.textContent    = 'Edit Task';
    saveTaskBtn.textContent   = 'Update Task';
    taskTitleInput.value      = task.title;
    taskDueDateInput.value    = task.dueDate;
    taskDescriptionInput.value= task.description || '';
    taskIdHidden.value        = task.id;

    // Subject: check if it's one of the presets
    const presets = ['Python','Java','Database','Web Development','Mathematics'];
    if (presets.includes(task.subject)) {
      taskSubjectSelect.value = task.subject;
      taskSubjectInput.classList.add('hidden');
    } else {
      taskSubjectSelect.value = 'custom';
      taskSubjectInput.classList.remove('hidden');
      taskSubjectInput.value = task.subject;
    }

    // Priority radio
    const radio = document.querySelector(`input[name="priority"][value="${task.priority}"]`);
    if (radio) radio.checked = true;

  } else {
    // Add mode
    modalTitle.textContent  = 'Add New Task';
    saveTaskBtn.textContent = 'Save Task';
    taskIdHidden.value      = '';
  }

  modalBackdrop.classList.add('open');
  modalBackdrop.removeAttribute('aria-hidden');
  taskTitleInput.focus();
}

/** closeModal() – closes and resets the task form */
function closeModal() {
  modalBackdrop.classList.remove('open');
  modalBackdrop.setAttribute('aria-hidden', 'true');
  resetForm();
  state.editingId = null;
}

/** resetForm() – clears all form fields and error messages */
function resetForm() {
  taskForm.reset();
  taskSubjectInput.classList.add('hidden');
  taskSubjectInput.value = '';
  taskSubjectSelect.value = '';
  clearFormErrors();
  // Reset priority to medium by default
  document.getElementById('prioMedium').checked = true;
}

/** clearFormErrors() – removes all inline validation messages */
function clearFormErrors() {
  titleError.textContent    = '';
  subjectError.textContent  = '';
  dateError.textContent     = '';
  priorityError.textContent = '';

  taskTitleInput.classList.remove('error');
  taskDueDateInput.classList.remove('error');
}

/* ============================================================
   FORM VALIDATION & SUBMIT
   ============================================================ */

/**
 * validateForm()
 * Checks all required fields and shows friendly error messages.
 * @returns {boolean} – true if form is valid, false otherwise
 */
function validateForm() {
  let valid = true;
  clearFormErrors();

  // Title
  const title = taskTitleInput.value.trim();
  if (!title) {
    titleError.textContent = 'Task title is required.';
    taskTitleInput.classList.add('error');
    valid = false;
  } else if (title.length < 3) {
    titleError.textContent = 'Title must be at least 3 characters.';
    taskTitleInput.classList.add('error');
    valid = false;
  }

  // Subject
  const subject = getSubjectValue();
  if (!subject) {
    subjectError.textContent = 'Please select or enter a subject.';
    valid = false;
  }

  // Due date
  const dueDate = taskDueDateInput.value;
  if (!dueDate) {
    dateError.textContent = 'Please select a due date.';
    taskDueDateInput.classList.add('error');
    valid = false;
  }

  // Priority
  const priority = document.querySelector('input[name="priority"]:checked');
  if (!priority) {
    priorityError.textContent = 'Please select a priority.';
    valid = false;
  }

  return valid;
}

/**
 * getSubjectValue()
 * Returns the correct subject string depending on whether
 * the user selected a preset or entered a custom name.
 * @returns {string}
 */
function getSubjectValue() {
  if (taskSubjectSelect.value === 'custom') {
    return taskSubjectInput.value.trim();
  }
  return taskSubjectSelect.value;
}

/**
 * handleFormSubmit(e)
 * Called when the task form is submitted.
 * Validates inputs, then adds or updates the task.
 */
function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateForm()) return;

  const priority = document.querySelector('input[name="priority"]:checked').value;

  const taskData = {
    title:       taskTitleInput.value.trim(),
    subject:     getSubjectValue(),
    dueDate:     taskDueDateInput.value,       // YYYY-MM-DD (no timezone issues)
    priority:    priority,
    description: taskDescriptionInput.value.trim(),
    completed:   false,
  };

  if (state.editingId) {
    // --- Update existing task ---
    const existing = getTasks().find(t => t.id === state.editingId);
    if (existing) {
      taskData.id        = existing.id;
      taskData.createdAt = existing.createdAt;
      taskData.completed = existing.completed; // preserve completion status
      updateTask(taskData);
      showToast('Task updated successfully! ✏️');
    }
  } else {
    // --- Add new task ---
    taskData.id        = generateId();
    taskData.createdAt = new Date().toISOString();
    addTask(taskData);
    showToast('Task added successfully! 🎉');
  }

  closeModal();
  renderAll();
}

/* ============================================================
   DELETE TASK
   ============================================================ */

/**
 * openDeleteDialog(id, title)
 * Shows the confirmation dialog before deleting a task.
 */
function openDeleteDialog(id, title) {
  state.deleteId = id;
  deleteTaskName.textContent = `"${title}"`;
  deleteBackdrop.classList.add('open');
  deleteBackdrop.removeAttribute('aria-hidden');
}

/** closeDeleteDialog() – hides the delete confirmation */
function closeDeleteDialog() {
  deleteBackdrop.classList.remove('open');
  deleteBackdrop.setAttribute('aria-hidden', 'true');
  state.deleteId = null;
}

/** handleConfirmDelete() – performs the actual deletion after confirmation */
function handleConfirmDelete() {
  if (!state.deleteId) return;
  deleteTask(state.deleteId);
  closeDeleteDialog();
  showToast('Task deleted. 🗑️', 'error');
  renderAll();
}

/* ============================================================
   TOGGLE COMPLETION
   ============================================================ */

/**
 * toggleCompletion(id)
 * Flips the `completed` flag on the task and saves it.
 * @param {string} id – Task id
 */
function toggleCompletion(id) {
  const tasks = getTasks();
  const task  = tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  updateTask(task);

  const msg = task.completed
    ? 'Task marked as completed! ✅'
    : 'Task marked as pending. 🔄';
  showToast(msg, task.completed ? 'success' : 'info');

  renderAll();
}

/* ============================================================
   CLEAR COMPLETED
   ============================================================ */

/** handleClearCompleted() – removes all completed tasks after user confirms */
function handleClearCompleted() {
  const tasks     = getTasks();
  const doneCount = tasks.filter(t => t.completed).length;

  if (doneCount === 0) {
    showToast('No completed tasks to clear.', 'warning');
    return;
  }

  if (!window.confirm(`Remove all ${doneCount} completed task(s)?`)) return;

  clearCompleted();
  showToast(`${doneCount} completed task(s) cleared! 🧹`);
  renderAll();
}

/* ============================================================
   FILTERING, SEARCHING, SORTING
   ============================================================ */

/**
 * getFilteredSortedTasks()
 * Applies the current filter, search query, and sort order
 * to return the correct subset of tasks.
 * @returns {Array} – Filtered and sorted task array
 */
function getFilteredSortedTasks() {
  let tasks = getTasks();

  // 1. Filter by status
  if (state.filter === 'pending')   tasks = tasks.filter(t => !t.completed);
  if (state.filter === 'completed') tasks = tasks.filter(t =>  t.completed);

  // 2. Search by title or subject (case-insensitive)
  if (state.search) {
    const q = state.search.toLowerCase();
    tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    );
  }

  // 3. Sort
  tasks.sort((a, b) => {
    if (state.sort === 'due') {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (state.sort === 'priority') {
      return (PRIORITY_ORDER[a.priority] || 99) - (PRIORITY_ORDER[b.priority] || 99);
    }
    if (state.sort === 'created') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return 0;
  });

  return tasks;
}

/** syncFilterTabs() – keeps tab highlights in sync with state.filter */
function syncFilterTabs() {
  filterTabs.forEach(tab => {
    const isActive = tab.dataset.filter === state.filter;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

/* ============================================================
   DATE HELPERS
   ============================================================ */

/**
 * getTodayString()
 * Returns today's date as a YYYY-MM-DD string
 * using local time (avoids UTC offset issues).
 * @returns {string}
 */
function getTodayString() {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  const d   = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * getTaskStatus(task)
 * Returns 'overdue', 'upcoming', or 'today' based on due date.
 * Tasks due within the next 3 days are marked 'upcoming'.
 * @param {Object} task
 * @returns {string}
 */
function getTaskStatus(task) {
  if (task.completed) return 'done';
  const today    = getTodayString();
  const due      = task.dueDate;
  const diffMs   = new Date(due) - new Date(today);
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return 'overdue';
  if (diffDays <= 3) return 'upcoming';
  return 'normal';
}

/**
 * formatDate(dateStr)
 * Converts YYYY-MM-DD to a readable format like "Oct 27, 2026".
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  // Parse as local date to avoid timezone shift
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ============================================================
   RENDER – MAIN ORCHESTRATOR
   ============================================================ */

/** renderAll() – re-renders both the dashboard and the task list */
function renderAll() {
  renderDashboard();
  renderTaskList();
}

/* ============================================================
   RENDER – DASHBOARD
   ============================================================ */

/** renderDashboard() – updates stats cards, progress bar, and today's tasks */
function renderDashboard() {
  const tasks      = getTasks();
  const total      = tasks.length;
  const completed  = tasks.filter(t => t.completed).length;
  const pending    = total - completed;
  const percent    = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Update stat cards
  statTotal.textContent     = total;
  statPending.textContent   = pending;
  statCompleted.textContent = completed;
  statPercent.textContent   = `${percent}%`;

  // Update progress bar
  progressBarFill.style.width = `${percent}%`;
  progressBarWrap.setAttribute('aria-valuenow', percent);
  progressValue.textContent   = `${percent}%`;

  // Show "all done" motivational message if every task is complete
  const allDone = total > 0 && completed === total;
  allDoneMessage.classList.toggle('hidden', !allDone);

  // Today's tasks section
  renderTodayTasks(tasks);
}

/**
 * renderTodayTasks(tasks)
 * Shows tasks that are due today on the dashboard.
 */
function renderTodayTasks(tasks) {
  const today     = getTodayString();
  const todayTasks= tasks.filter(t => t.dueDate === today);

  todayTasksList.innerHTML = '';

  if (todayTasks.length === 0) {
    todayTasksList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <rect x="5" y="7" width="26" height="22" rx="3" stroke="currentColor" stroke-width="2"/>
            <path d="M12 13h12M12 19h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
        <h3>No tasks due today</h3>
        <p>You're free today! Enjoy your study session or add tasks for upcoming deadlines.</p>
      </div>`;
    return;
  }

  todayTasks.forEach(task => {
    const item = document.createElement('div');
    item.className = `today-task-item${task.completed ? ' completed' : ''}`;

    item.innerHTML = `
      <div class="today-check ${task.completed ? 'done' : ''}"
           role="button"
           tabindex="0"
           aria-label="${task.completed ? 'Mark as pending' : 'Mark as completed'}: ${escapeHtml(task.title)}"
           data-id="${task.id}">
      </div>
      <div class="today-task-info">
        <div class="today-task-title">${escapeHtml(task.title)}</div>
        <div class="today-task-sub">${escapeHtml(task.subject)} · ${priorityLabel(task.priority)}</div>
      </div>
      <span class="badge-priority ${task.priority}">${capitalize(task.priority)}</span>`;

    // Click on the circle to toggle completion
    item.querySelector('.today-check').addEventListener('click', () => toggleCompletion(task.id));
    item.querySelector('.today-check').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') toggleCompletion(task.id);
    });

    todayTasksList.appendChild(item);
  });
}

/* ============================================================
   RENDER – TASK LIST (Tasks Page)
   ============================================================ */

/** renderTaskList() – renders the filtered/sorted task cards */
function renderTaskList() {
  const tasks = getFilteredSortedTasks();
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskList.appendChild(buildEmptyState());
    return;
  }

  tasks.forEach(task => {
    taskList.appendChild(buildTaskCard(task));
  });
}

/**
 * buildTaskCard(task)
 * Creates and returns a task card DOM element.
 * @param {Object} task
 * @returns {HTMLElement}
 */
function buildTaskCard(task) {
  const status    = getTaskStatus(task);
  const card      = document.createElement('div');
  card.className  = `task-card priority-${task.priority}${task.completed ? ' completed' : ''}${status === 'overdue' ? ' overdue' : ''}${status === 'upcoming' ? ' upcoming' : ''}`;
  card.setAttribute('role', 'listitem');
  card.dataset.id = task.id;

  // Build status badge HTML
  let statusBadge = '';
  if (status === 'overdue')  statusBadge = `<span class="badge-status overdue">Overdue</span>`;
  if (status === 'upcoming') statusBadge = `<span class="badge-status upcoming">Due Soon</span>`;
  if (task.completed)        statusBadge = `<span class="badge-status done">Completed</span>`;

  // Description block (only if present)
  const descHtml = task.description
    ? `<div class="task-description">${escapeHtml(task.description)}</div>`
    : '';

  card.innerHTML = `
    <div class="task-checkbox-wrap">
      <input type="checkbox"
             class="task-checkbox"
             id="chk-${task.id}"
             aria-label="${task.completed ? 'Mark as pending' : 'Mark as completed'}: ${escapeHtml(task.title)}"
             ${task.completed ? 'checked' : ''} />
    </div>
    <div class="task-body">
      <div class="task-header-row">
        <label class="task-title" for="chk-${task.id}">${escapeHtml(task.title)}</label>
        <div class="task-badges">
          <span class="badge-priority ${task.priority}">${capitalize(task.priority)}</span>
          ${statusBadge}
        </div>
      </div>
      <div class="task-meta">
        <span class="task-meta-item">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <rect x="1" y="2" width="11" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/>
            <path d="M4 1v2M9 1v2M1 5h11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          ${formatDate(task.dueDate)}
        </span>
        <span class="task-meta-item">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M2 4h9M2 7h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          ${escapeHtml(task.subject)}
        </span>
      </div>
      ${descHtml}
    </div>
    <div class="task-actions">
      <button class="icon-btn icon-btn-edit" aria-label="Edit task: ${escapeHtml(task.title)}" data-action="edit">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M10.5 2.5L12.5 4.5L5 12H3v-2L10.5 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="icon-btn icon-btn-delete" aria-label="Delete task: ${escapeHtml(task.title)}" data-action="delete">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M2.5 4h10M5 4V3h5v1M4 4l.5 8h6L11 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>`;

  // Attach event listeners
  card.querySelector('.task-checkbox').addEventListener('change', () => toggleCompletion(task.id));

  card.querySelector('[data-action="edit"]').addEventListener('click', () => {
    const t = getTasks().find(x => x.id === task.id);
    if (t) openModal(t);
  });

  card.querySelector('[data-action="delete"]').addEventListener('click', () => {
    openDeleteDialog(task.id, task.title);
  });

  return card;
}

/**
 * buildEmptyState()
 * Returns a friendly empty-state element when no tasks are found.
 * @returns {HTMLElement}
 */
function buildEmptyState() {
  const div = document.createElement('div');
  div.className = 'empty-state';

  const isSearching = state.search.length > 0;
  const isFiltering = state.filter !== 'all';

  let title, message;

  if (isSearching) {
    title   = 'No results found';
    message = `No tasks match "${escapeHtml(state.search)}". Try a different keyword.`;
  } else if (isFiltering) {
    title   = state.filter === 'completed' ? 'No completed tasks yet' : 'No pending tasks!';
    message = state.filter === 'completed'
      ? 'You haven\'t completed any tasks yet. Get started!'
      : 'Great job! All your tasks are completed. 🎉';
  } else {
    title   = 'No tasks yet';
    message = 'Click "Add Task" to create your first study task and start tracking your progress!';
  }

  div.innerHTML = `
    <div class="empty-state-icon">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <rect x="5" y="7" width="26" height="22" rx="3" stroke="currentColor" stroke-width="2"/>
        <path d="M12 15h12M12 21h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="27" cy="9" r="5" fill="currentColor" opacity=".2"/>
        <path d="M25 9h4M27 7v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
    <h3>${title}</h3>
    <p>${message}</p>`;

  return div;
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */

/**
 * showToast(message, type)
 * Displays a floating notification that auto-dismisses after 3.5 s.
 * @param {string} message – Text to display
 * @param {string} [type='success'] – 'success' | 'error' | 'warning' | 'info'
 */
function showToast(message, type = 'success') {
  const icons = {
    success: '✅',
    error:   '🗑️',
    warning: '⚠️',
    info:    'ℹ️',
  };

  const toast       = document.createElement('div');
  toast.className   = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML   = `<span class="toast-icon" aria-hidden="true">${icons[type] || '✅'}</span><span>${message}</span>`;

  toastContainer.appendChild(toast);

  // Auto-remove after 3.5 s with fade-out animation
  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3500);
}

/* ============================================================
   UTILITY HELPERS
   ============================================================ */

/**
 * escapeHtml(str)
 * Prevents XSS by escaping HTML special characters.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
  return String(str || '').replace(/[&<>"']/g, m => map[m]);
}

/**
 * capitalize(str)
 * Capitalises the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/**
 * priorityLabel(priority)
 * Returns a colourful emoji + text label for a priority level.
 * @param {string} priority
 * @returns {string}
 */
function priorityLabel(priority) {
  const labels = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };
  return labels[priority] || priority;
}

/* ============================================================
   KICK OFF
   ============================================================

   FIX: Use a readyState guard instead of a bare DOMContentLoaded
   listener.  When scripts are placed at the bottom of <body>,
   browsers running the page via the file:// protocol (i.e. opening
   index.html directly without a web server) can fire DOMContentLoaded
   BEFORE the script finishes executing, meaning the listener would be
   registered too late and init() would never be called.

   The guard below covers both cases:
   • 'loading'  → DOM not yet ready, register the listener normally.
   • 'interactive' / 'complete' → DOM already ready, call init() now.
   ============================================================ */

if (document.readyState === 'loading') {
  // DOM is still being parsed — wait for it to finish
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already fully parsed — safe to call init() immediately
  init();
}
