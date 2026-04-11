import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// On 401, clear user data
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  },
);

export default api;
