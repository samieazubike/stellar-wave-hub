import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach stored token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Surface API error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

// Convenience methods for assignment-focused endpoints
api.createProject = (project) => api.post('/projects', project);
api.getProject = (slugOrId) => api.get(`/projects/${slugOrId}`);
api.updateProject = (id, updates) => api.put(`/projects/${id}`, updates);
api.approveProject = (id, options = {}) => api.put(`/projects/${id}/approve`, options);
api.rejectProject = (id, reason) => api.put(`/projects/${id}/reject`, { reason });

api.getFinancialsSummary = (projectId) => api.get(`/financials/${projectId}/summary`);
api.getFinancialsTransactions = (projectId) => api.get(`/financials/${projectId}/transactions`);
api.getFinancialsContractOps = (projectId) => api.get(`/financials/${projectId}/contract-ops`);

export default api;
