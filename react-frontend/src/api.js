import axios from 'axios';
import { API_PREFIX } from './config';
import { getToken } from './authToken';

const api = axios.create({
  baseURL: API_PREFIX,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 429) {
      const retryAfter = error?.response?.headers?.['retry-after'];
      error.message = retryAfter
        ? `Too many requests. Try again after ${retryAfter} seconds.`
        : 'Too many requests. Please try again later.';
    }
    return Promise.reject(error);
  }
);

export default api;

