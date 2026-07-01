import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (username, password) => api.post('/auth/login', { username, password });
export const me = () => api.get('/auth/me');

// Forms
export const listForms = () => api.get('/forms');
export const getForm = (id) => api.get(`/forms/${id}`);
export const createForm = (payload) => api.post('/forms', payload);
export const updateForm = (id, payload) => api.put(`/forms/${id}`, payload);
export const updateFormStatus = (id, durum, aciklama) =>
  api.patch(`/forms/${id}/status`, { durum, aciklama });
export const queryForm = (formNo) => api.get(`/forms/query/${encodeURIComponent(formNo)}`);
export const deleteForm = (id) => api.delete(`/forms/${id}`);

// Status mapping
export const STATUS_LABEL = {
  ilk_girildi: 'İlk Girildi',
  isleme_alindi: 'İşleme Alındı',
  tamamlandi: 'Tamamlandı'
};