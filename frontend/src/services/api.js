import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Thread APIs
export const threadAPI = {
    list: () => api.get('/threads'),
    create: (title) => api.post('/threads', { title }),
    get: (id) => api.get(`/threads/${id}`),
    update: (id, title) => api.patch(`/threads/${id}`, { title }),
    delete: (id) => api.delete(`/threads/${id}`),
};

// Document APIs
export const documentAPI = {
    upload: (file, threadId) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('thread_id', threadId);
        return api.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    list: (threadId) => api.get(`/documents?thread_id=${threadId}`),
    delete: (id) => api.delete(`/documents/${id}`),
};

// Chat API with SSE
export const chatAPI = {
    sendMessage: (message, threadId, enableSearch = false) => {
        return new EventSource(
            `${API_BASE_URL}/chat?` +
            new URLSearchParams({
                message,
                thread_id: threadId,
                enable_search: enableSearch,
            })
        );
    },
};

export default api;
