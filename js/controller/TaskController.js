class TaskController {
  constructor(apiImplementation) {
    if (!(apiImplementation instanceof BaseApi)) {
      throw new Error('API реализация должна наследоваться от BaseApi');
    }
    this.api = apiImplementation;
  }

  async executeRequest(requestPromise, message) {
    try {
      let result = await requestPromise;
      console.log(message, result);
      return result;
    } catch (error) {
      console.error('Ошибка при обработке ответа:', error);
      throw error;
    }
  }

  async getTasks(params = {}) {
    return this.executeRequest(
      this.api.get('/tasks', params),
      'Получение всех задач:'
    );
  }

  async createTask(taskData) {
    return this.executeRequest(
      this.api.post('/tasks', taskData),
      'Создана задача:'
    );
  }

  async getTaskById(id) {
    return this.executeRequest(
      this.api.get(`/tasks/${id}`),
      'Получена задача:'
    );
  }

  async updateTask(id, updateData) {
    return this.executeRequest(
      this.api.patch(`/tasks/${id}`, updateData),
      'Обновлена задача:'
    );
  }

  async deleteTask(id) {
    return this.executeRequest(
      this.api.delete(`/tasks/${id}`),
      'Удалена задача'
    );
  }
}
