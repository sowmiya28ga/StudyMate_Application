/**
 * storage.js – StudyMate
 * ─────────────────────
 * All localStorage operations are isolated here.
 * Each function is clearly commented for easy understanding.
 */

const STORAGE_KEY = 'studymate_tasks';

/**
 * getTasks()
 * Retrieves all saved tasks from localStorage.
 * Returns an empty array if no data exists or if data is corrupted.
 */
function getTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];                    // No data yet – first run
    const parsed = JSON.parse(raw);
    // Make sure we always return an array
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // JSON.parse failed – data is corrupted; start fresh
    console.warn('StudyMate: localStorage data was corrupted. Resetting.', err);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * saveTasks(tasks)
 * Saves the entire tasks array to localStorage.
 * @param {Array} tasks – Array of task objects to persist
 */
function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('StudyMate: Failed to save tasks.', err);
  }
}

/**
 * addTask(task)
 * Appends a new task object to the saved list.
 * @param {Object} task – Task object (must have an `id` property)
 */
function addTask(task) {
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
}

/**
 * updateTask(updatedTask)
 * Replaces the task whose `id` matches with the new data.
 * @param {Object} updatedTask – Task object with the same id as the one to update
 */
function updateTask(updatedTask) {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === updatedTask.id);
  if (index !== -1) {
    tasks[index] = updatedTask;
    saveTasks(tasks);
  }
}

/**
 * deleteTask(id)
 * Removes the task with the given id from storage.
 * @param {string} id – The unique id of the task to delete
 */
function deleteTask(id) {
  const tasks = getTasks();
  const filtered = tasks.filter(t => t.id !== id);
  saveTasks(filtered);
}

/**
 * clearCompleted()
 * Removes all tasks whose `completed` flag is true.
 */
function clearCompleted() {
  const tasks = getTasks();
  const remaining = tasks.filter(t => !t.completed);
  saveTasks(remaining);
}

/**
 * generateId()
 * Creates a simple unique ID for each new task.
 * Uses timestamp + random suffix to avoid collisions.
 * @returns {string} – A unique id string
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
