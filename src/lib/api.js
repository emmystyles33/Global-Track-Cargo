const TOKEN_KEY = 'shiptrack_admin_token';
const DEFAULT_RENDER_API_URL = 'https://swiftcargo-api.onrender.com';
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : import.meta.env.PROD
  ? DEFAULT_RENDER_API_URL
  : '';
const API_PREFIX = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_PREFIX}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        'Unable to connect to the server. Server is waking up or unreachable — please wait a few seconds and try again.'
      );
    }
    throw err;
  }
}

export const api = {
  login: (password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),

  listShipments: (search = '') =>
    request(`/shipments${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  createShipment: (payload) =>
    request('/shipments', { method: 'POST', body: JSON.stringify(payload) }),

  getShipment: (id) => request(`/shipments/${id}`),

  getShipmentUpdates: (id) => request(`/shipments/${id}/updates`),

  addShipmentUpdate: (id, payload) =>
    request(`/shipments/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteShipmentUpdate: (id, updateId) =>
    request(`/shipments/${id}/updates/${updateId}`, {
      method: 'DELETE',
    }),

  updateShipment: (id, payload) =>
    request(`/shipments/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  deleteShipment: (id) => request(`/shipments/${id}`, { method: 'DELETE' }),

  setHold: (id, action) =>
    request(`/shipments/${id}/hold`, { method: 'POST', body: JSON.stringify({ action }) }),

  trackPublic: (trackingNumber) => request(`/shipments/public/${trackingNumber}`),

  geocode: (place) => request(`/geocode?place=${encodeURIComponent(place)}`),

  async uploadImage(file) {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_PREFIX}/images/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error(
          'Unable to connect to the server. Server is waking up or unreachable — please wait a few seconds and try again.'
        );
      }
      throw err;
    }
  },
};
