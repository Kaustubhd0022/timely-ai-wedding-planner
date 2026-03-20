/**
 * Simple API client helper for fetch requests with error handling
 */
export const apiClient = {
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, { ...options, method: "GET" });
    return this.handleResponse<T>(response);
  },

  async post<T>(url: string, body: any, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  },

  async patch<T>(url: string, body: any, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  },

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, { ...options, method: "DELETE" });
    return this.handleResponse<T>(response);
  },

  async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "An unknown error occurred" }));
      throw new Error(error.message || response.statusText);
    }
    return response.json() as Promise<T>;
  },
};
