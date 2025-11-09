class XHRapi extends BaseApi {
  _makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = this.baseURL + path;

      xhr.open(method, url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = () => {
        let responseData = null;
        try {
          responseData = this.parseJson(xhr.responseText);
        } catch (parseError) {
          reject(new Error('Неверный формат JSON в ответе сервера'));
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseData);
        } else {
          const error = this.createError(
            xhr.status,
            xhr.statusText,
            responseData
          );
          reject(error);
        }
      };

      xhr.onerror = () => {
        reject(new Error('Сетевая ошибка при выполнении запроса'));
      };

      xhr.send(data ? JSON.stringify(data) : null);
    });
  }

  get(path, params = {}) {
    const queryString = Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this._makeRequest('GET', path + queryString);
  }

  post(path, data = {}) {
    return this._makeRequest('POST', path, data);
  }

  patch(path, data = {}) {
    return this._makeRequest('PATCH', path, data);
  }

  delete(path) {
    return this._makeRequest('DELETE', path);
  }
}
