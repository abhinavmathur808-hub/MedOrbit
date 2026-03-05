const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    AUTH: `${API_BASE_URL}/api/auth`,
    USERS: `${API_BASE_URL}/api/users`,
    DOCTORS: `${API_BASE_URL}/api/doctor`,
    APPOINTMENTS: `${API_BASE_URL}/api/appointments`,
    ARTICLES: `${API_BASE_URL}/api/articles`,
    AI: `${API_BASE_URL}/api/ai`,
};

export default API_BASE_URL;
