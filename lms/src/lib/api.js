const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

function getToken() {
  return localStorage.getItem('lms-token');
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  // File upload
  uploadFiles: (formData) => {
    const token = getToken();
    return fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      return data;
    });
  },

  // Auth
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  forgotPassword:  (username)              => request('POST', '/auth/forgot',         { username }),
  verifyOtp:       (username, otp)         => request('POST', '/auth/verify-otp',     { username, otp }),
  resetPassword:   (resetToken, newPassword) => request('POST', '/auth/reset-password', { resetToken, newPassword }),
  changePassword:  (newPassword)           => request('POST', '/auth/change-password', { newPassword }),

  // Users
  getUsers:      ()         => request('GET',    '/users'),
  getUserDirectory: ()      => request('GET',    '/users/directory'),
  addUser:    (data)     => request('POST',   '/users', data),
  updateUser: (id, data) => request('PUT',    `/users/${id}`, data),
  deleteUser: (id)       => request('DELETE', `/users/${id}`),
  resetUserPassword: (id) => request('POST',  `/users/${id}/reset-password`),

  // Incoming
  getIncoming:              ()         => request('GET',    '/incoming'),
  getDeletedIncoming:       ()         => request('GET',    '/incoming/deleted'),
  addIncoming:              (data)     => request('POST',   '/incoming', data),
  updateIncoming:           (id, data) => request('PUT',    `/incoming/${id}`, data),
  deleteIncoming:           (id)       => request('DELETE', `/incoming/${id}`),
  restoreIncoming:          (id)       => request('POST',   `/incoming/${id}/restore`),
  permanentDeleteIncoming:  (id)       => request('DELETE', `/incoming/${id}/permanent`),
  dispatchLetter: (id, data) => request('POST', `/incoming/${id}/dispatch`, data),

  // Outgoing
  getOutgoing:              ()         => request('GET',    '/outgoing'),
  getDeletedOutgoing:       ()         => request('GET',    '/outgoing/deleted'),
  addOutgoing:              (data)     => request('POST',   '/outgoing', data),
  updateOutgoing:           (id, data) => request('PUT',    `/outgoing/${id}`, data),
  deleteOutgoing:           (id)       => request('DELETE', `/outgoing/${id}`),
  restoreOutgoing:          (id)       => request('POST',   `/outgoing/${id}/restore`),
  permanentDeleteOutgoing:  (id)       => request('DELETE', `/outgoing/${id}/permanent`),

  // Offices & Departments (dynamic)
  getOffices:         ()          => request('GET',    '/offices'),
  addOffice:          (data)      => request('POST',   '/offices', data),
  updateOffice:       (id, data)  => request('PUT',    `/offices/${id}`, data),
  deleteOffice:       (id)        => request('DELETE', `/offices/${id}`),
  getDepartments:     ()          => request('GET',    '/departments'),
  addDepartment:      (data)      => request('POST',   '/departments', data),
  updateDepartment:   (id, data)  => request('PUT',    `/departments/${id}`, data),
  deleteDepartment:   (id)        => request('DELETE', `/departments/${id}`),

  // Audit
  getAuditLog: () => request('GET', '/audit'),

  // Inbox
  getInbox:           ()          => request('GET',   '/inbox'),
  getAllInbox:         ()          => request('GET',   '/inbox/all'),
  markInboxRead:      (id)        => request('PATCH', `/inbox/${id}/read`),
  createInboxRecord:  (userId, letterId) => request('POST', '/inbox', { userId, letterId }),
  cleanupInbox:       ()          => request('POST',  '/inbox/cleanup'),

  // Chat
  getConversations:  ()               => request('GET',    '/chat'),
  getMessages:       (userId)         => request('GET',    `/chat/${userId}`),
  sendMessage:       (userId, text, replyTo)   => request('POST',   `/chat/${userId}`, { text, replyTo }),
  editMessage:       (msgId, text)    => request('PUT',    `/chat/msg/${msgId}`, { text }),
  deleteMessage:     (msgId)          => request('DELETE', `/chat/msg/${msgId}`),
  reactMessage:      (msgId, emoji)   => request('POST',   `/chat/msg/${msgId}/react`, { emoji }),

  // Groups
  getGroups:         ()               => request('GET',    '/groups'),
  createGroup:       (data)           => request('POST',   '/groups', data),
  updateGroup:       (id, data)       => request('PUT',    `/groups/${id}`, data),
  addGroupMember:    (id, userId)     => request('POST',   `/groups/${id}/members`, { userId }),
  removeGroupMember: (id, userId)     => request('DELETE', `/groups/${id}/members/${userId}`),
  assignGroupAdmin:  (id, userId)     => request('POST',   `/groups/${id}/admins`, { userId }),
  deleteGroup:       (id)             => request('DELETE', `/groups/${id}`),
  getGroupMessages:  (id)             => request('GET',    `/groups/${id}/messages`),
  sendGroupMessage:  (id, text, replyTo) => request('POST', `/groups/${id}/messages`, { text, replyTo }),
  markGroupRead:     (id)             => request('POST',   `/groups/${id}/read`),
};
