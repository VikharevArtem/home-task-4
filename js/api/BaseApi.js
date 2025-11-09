class BaseApi {
  constructor(baseURL = 'https://tasks-service-maks1394.amvera.io') {
    this.baseURL = baseURL;
  }

  buildUrl(path, params = {}) {
    if (!params || Object.keys(params).length === 0) {
      return `${this.baseURL}${path}`;
    }
    const queryString = new URLSearchParams(params).toString();
    return `${this.baseURL}${path}?${queryString}`;
  }

  parseJson(text) {
    try {
      return text ? JSON.parse(text) : null;
    } catch (e) {
      throw new Error('Некорректный JSON в ответе сервера');
    }
  }

  createError(status, statusText, errorBody = null) {
    const message = errorBody?.error || `HTTP ${status}: ${statusText}`;
    const error = new Error(message);
    error.status = status;
    return error;
  }
}
