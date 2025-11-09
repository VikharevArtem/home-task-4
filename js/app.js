let taskController = null;
let currentTasks = [];

//DOM-элементы
const DOM = {
  apiMethod: document.getElementById('apiMethod'),
  tasksList: document.getElementById('tasksList'),
  getTasksButton: document.getElementById('#getTasksButton button'),
  createTaskForm: document.getElementById('createTaskForm'),
  createTaskResult: document.getElementById('createTaskResult'),
  updateForm: document.getElementById('updateTaskForm'),
  updateTaskResult: document.getElementById('updateTaskResult'),
  deleteTaskResult: document.getElementById('deleteTaskResult'),
  getTaskByIdResult: document.getElementById('getTaskByIdResult'),

  //Селекторы задач
  taskIdSelect: document.getElementById('taskIdSelect'),
  updateTaskIdSelect: document.getElementById('updateTaskIdSelect'),
  deleteTaskIdSelect: document.getElementById('deleteTaskIdSelect'),
};

DOM.updateForm.addEventListener('submit', (e) => e.preventDefault());
DOM.createTaskForm.addEventListener('submit', (e) => e.preventDefault());

function initController(method) {
  method === 'fetch'
    ? (taskController = new TaskController(new FetchApi()))
    : (taskController = new TaskController(new XHRapi()));
  console.log(
    `✅ Контроллер инициализирован с использованием ${method.toUpperCase()}`
  );
}

function renderTaskCard(task) {
  const { id, name = '', info = '', isImportant, isCompleted } = task;
  return `
      <div class="task-card ${isImportant ? 'important' : ''} ${
    isCompleted ? 'completed' : ''
  }">
      <div class="task-id">ID: ${id}</div>
      <div class="task-name">${name || ''}</div>
      <div class="task-info">${info ? info : '<em>Без описания</em>'}</div>
      <div class="task-meta">
        <span>${isImportant ? 'Важная' : 'Обычная'}</span>
        <span>${isCompleted ? 'Завершена' : 'В работе'}</span>
      </div>
    </div>
  `;
}

function renderTasks(tasks) {
  currentTasks = Array.isArray(tasks) ? tasks : [];

  if (!DOM.tasksList) return;

  if (currentTasks.length === 0) {
    DOM.tasksList.innerHTML = '<p class="no-tasks">Задачи не найдены.</p>';
    updateTaskIdSelects([]);
    return;
  }
  DOM.tasksList.innerHTML = currentTasks.map(renderTaskCard).join('');
  updateTaskIdSelects(currentTasks);
}

function updateTaskIdSelects(tasks) {
  const ids = tasks.map((t) => t.id);
  const selects = [
    DOM.taskIdSelect,
    DOM.updateTaskIdSelect,
    DOM.deleteTaskIdSelect,
  ].filter(Boolean);

  selects.forEach((select) => {
    const currentVal = select.value;
    select.innerHTML = '';
    select.disabled = true;

    if (ids.length === 0) {
      const option = new Option(`— Задачи отсутствуют —`);
      select.add(option);
      select.disabled = true;
    } else {
      select.add(new Option('— Выберите ID —'));
      ids.forEach((id) => select.add(new Option(`ID ${id}`, id)));
      select.disabled = false;
      if (ids.includes(Number(currentVal))) select.value = currentVal;
    }
  });
}

function renderSingleTask(containerId, task) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = renderTaskCard(task);
}

function renderError(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<p class="error-message">${message}</p>`;
  }
}
function renderSuccess(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<p class="success-message">${message}</p>`;
  }
}

//Превью задачи при выборе ID
async function previewTaskForAction(selectId, containerId) {
  const select = document.getElementById(selectId);
  const container = document.getElementById(containerId);
  if (!select || !container) return;

  const id = select.value;
  container.innerHTML = '';

  if (!id) return;

  const task = currentTasks.find((t) => t.id == id);

  if (task) {
    renderSingleTask(containerId, task);
  } else {
    try {
      const fetchedTask = await taskController.getTaskById(Number(id));
      renderSingleTask(containerId, fetchedTask);
    } catch (error) {
      renderError(containerId, `Не удалось загрузить задачу: ${error.message}`);
    }
  }
}

function setLoading(button, isLoading) {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }
    button.disabled = true;
    button.textContent = 'Загрузка...';
  } else {
    button.disabled = false;

    button.textContent = button.dataset.originalText || 'Загрузка...';
  }
}

async function getTasks() {
  const isImportant = document.getElementById('isImportantFilter')?.checked;
  const isCompleted = document.getElementById('isCompletedFilter')?.checked;
  const name_like = document.getElementById('nameLikeFilter')?.value?.trim();
  const button = document.querySelector('#getTasksSection button');
  setLoading(button, true);

  const params = {};
  if (isImportant !== false) params.isImportant = isImportant;
  if (isCompleted !== false) params.isCompleted = isCompleted;
  if (name_like) params.name_like = name_like;

  try {
    const tasks = await taskController.getTasks(params);
    renderTasks(tasks);
  } catch (error) {
    renderTasks([]);
    renderError('tasksList', `Не удалось загрузить задачи: ${error.message}`);
  } finally {
    setLoading(button, false);
  }
}

async function createTask() {
  const name = document.getElementById('createName')?.value?.trim();
  const info = document.getElementById('createInfo')?.value?.trim();
  const isImportant = document.getElementById('createIsImportant')?.checked;
  const isCompleted = document.getElementById('createIsCompleted')?.checked;
  const button = document.querySelector('#createTaskSection button');

  if (!name) {
    renderError('createTaskResult', 'Название задачи обязательно!');
    return;
  }

  const data = { name, info, isImportant, isCompleted };
  if (info) data.info = info;
  data.isImportant = isImportant;
  data.isCompleted = isCompleted;

  try {
    const result = await taskController.createTask(data);
    renderSingleTask('createTaskResult', result);
    document.getElementById('createName').value = '';
    document.getElementById('createInfo').value = '';
    document.getElementById('createIsImportant').checked = false;
    document.getElementById('createIsCompleted').checked = false;
    setLoading(button, true);
    getTasks(); //перезагрузка списка задач
  } catch (error) {
    renderError('createTaskResult', `Ошибка создания: ${error.message}`);
  } finally {
    setLoading(button, false);
  }
}

async function getTaskById() {
  const id = document.getElementById('taskIdSelect')?.value;
  const button = document.querySelector('#getTaskByIdSection button');

  setLoading(button, true);
  if (!id || isNaN(id)) {
    renderError('getTaskByIdResult', 'Выберите ID задачи');
    setLoading(button, false);
    return;
  }

  try {
    const result = await taskController.getTaskById(Number(id));
    renderSingleTask('getTaskByIdResult', result);
  } catch (error) {
    renderError('getTaskByIdResult', `Ошибка получения: ${error.message}`);
  } finally {
    setLoading(button, false);
  }
}

async function updateTask() {
  const id = document.getElementById('updateTaskIdSelect')?.value;
  if (!id || isNaN(id)) {
    renderError('Выберите ID задачи');
    return;
  }

  const name = document.getElementById('updateName')?.value?.trim();
  const info = document.getElementById('updateInfo')?.value?.trim();
  const isImportant = document.getElementById('updateIsImportant')?.checked;
  const isCompleted = document.getElementById('updateIsCompleted')?.checked;

  const data = {};
  if (name !== undefined && name !== '') data.name = name;
  if (info !== undefined && info !== '') data.info = info;
  if (isImportant !== undefined) data.isImportant = isImportant;
  if (isCompleted !== undefined) data.isCompleted = isCompleted;

  try {
    const result = await taskController.updateTask(Number(id), data);
    renderSingleTask('updateTaskResult', result);
    id.value = '';
    getTasks();
    renderSuccess('updateTaskResult', `Задача ID ${id} успешно обновлена`);
    DOM.updateForm.hidden = true;
  } catch (error) {
    renderError('updateTaskResult', `Ошибка обновления: ${error.message}`);
  }
}

async function deleteTask() {
  const id = document.getElementById('deleteTaskIdSelect')?.value;
  if (!id || isNaN(id)) {
    renderError('deleteTaskResult', 'Выберите ID задачи');
    return;
  }

  if (!confirm(`Вы уверены, что хотите удалить задачу ID ${id}?`)) {
    return;
  }

  try {
    const result = await taskController.deleteTask(Number(id));
    renderSingleTask('deleteTaskResult', result);
    getTasks();
    renderSuccess('deleteTaskResult', `Задача ID ${id} успешно удалена`);
  } catch (error) {
    renderError('deleteTaskResult', `Ошибка удаления: ${error.message}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const methodSelect = document.getElementById('apiMethod');
  if (!methodSelect) return;

  initController(methodSelect.value);

  methodSelect.addEventListener('change', (e) => {
    initController(e.target.value);
    currentTasks = [];
    updateTaskIdSelects([]);
    document
      .querySelectorAll('.tasks-list, .single-task-result')
      .forEach((el) => (el.innerHTML = ''));
  });

  // Preview задачи при выборе (для обновления и удаления)
  document
    .getElementById('updateTaskIdSelect')
    ?.addEventListener('change', (e) => {
      if (!e.target.value || isNaN(e.target.value)) {
        clearUpdateForm();
        renderError('updateTaskResult', 'Выберите ID задачи');
        document.getElementById('updateTaskForm').hidden = true;
        return;
      }
      const id = e.target.value;
      document.getElementById('updateTaskForm').hidden = false;
      previewTaskForAction('updateTaskIdSelect', 'updateTaskResult');

      if (id) autoFillUpdateForm(id);
    });

  document
    .getElementById('deleteTaskIdSelect')
    ?.addEventListener('change', (e) => {
      if (!e.target.value || isNaN(e.target.value)) {
        renderError('deleteTaskResult', 'Выберите ID задачи');
        return;
      }
      previewTaskForAction('deleteTaskIdSelect', 'deleteTaskResult');
    });

  document
    .getElementById('updateTaskIdSelect')
    ?.addEventListener('input', (e) => {
      if (!e.target.value) clearUpdateForm();
    });
});

//Автозаполнение формы обновления
function autoFillUpdateForm(id) {
  const task = currentTasks.find((t) => t.id == id);
  if (!task) return;

  document.getElementById('updateName').value = task.name || '';
  document.getElementById('updateInfo').value = task.info || '';
  document.getElementById('updateIsImportant').checked = !!task.isImportant;
  document.getElementById('updateIsCompleted').checked = !!task.isCompleted;
}

//Очистка формы обновления
function clearUpdateForm() {
  document.getElementById('updateName').value = '';
  document.getElementById('updateInfo').value = '';
  document.getElementById('updateIsImportant').checked = false;
  document.getElementById('updateIsCompleted').checked = false;
  document.getElementById('updateTaskResult').innerHTML = '';
}
