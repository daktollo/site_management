import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach the stored JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear the session and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (location.hash !== '#/login') location.hash = '#/login';
    }
    return Promise.reject(err);
  }
);

export default api;
