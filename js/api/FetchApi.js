class FetchApi extends BaseApi {
  baseURL = 'https://tasks-service-maks1394.amvera.io';
  async request(path, options = {}) {
    const url =
      options.method === 'GET'
        ? this.buildUrl(path, options.params)
        : `${this.baseURL}${path}`;

    const config = {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw this.createError(response.status, response.statusText, errorData);
    }

    return response.status !== 204 ? response.json() : null;
  }

  async get(path, params = {}) {
    return this.request(path, { method: 'GET', params });
  }

  async post(path, data = {}) {
    return this.request(path, { method: 'POST', body: data });
  }

  async patch(path, data = {}) {
    return this.request(path, { method: 'PATCH', body: data });
  }

  async delete(path) {
    return this.request(path, { method: 'DELETE' });
  }
}
