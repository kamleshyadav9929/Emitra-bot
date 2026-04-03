const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const getAuthHeaders = () => {
  const token = localStorage.getItem("admin_token")
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  }
}

export const login = (password) =>
  fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  }).then(r => r.json())

export const loginAdmin = login

export const getStats = () =>
  fetch(`${BASE_URL}/api/stats`, { headers: getAuthHeaders() }).then(r => r.json())

export const getStudents = (exam = "ALL") =>
  fetch(`${BASE_URL}/api/students?exam=${exam}`, { headers: getAuthHeaders() }).then(r => r.json())

export const sendNotification = (exam, message) =>
  fetch(`${BASE_URL}/api/send-notification`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ exam, message })
  }).then(r => r.json())

export const getLogs = () =>
  fetch(`${BASE_URL}/api/logs`, { headers: getAuthHeaders() }).then(r => r.json())

export const getServiceRequests = (status = "") =>
  fetch(`${BASE_URL}/api/service-requests${status ? `?status=${status}` : ""}`, { headers: getAuthHeaders() }).then(r => r.json())

export const sendReceipt = (telegramId, message, requestId) =>
  fetch(`${BASE_URL}/api/send-receipt`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ telegram_id: telegramId, message, request_id: requestId })
  }).then(r => r.json())

export const getStudentDocuments = (telegramId) =>
  fetch(`${BASE_URL}/api/documents/${telegramId}`, { headers: getAuthHeaders() }).then(r => r.json())

export const getDocumentUrl = (fileId) =>
  fetch(`${BASE_URL}/api/document-url/${fileId}`, { headers: getAuthHeaders() }).then(r => r.json())


// ── Bot Settings API ──────────────────────────────────────────────────────────
export const getBotSettings = () =>
  fetch(`${BASE_URL}/api/bot-settings`, { headers: getAuthHeaders() }).then(r => r.json())

export const saveBotSettings = (settings) =>
  fetch(`${BASE_URL}/api/bot-settings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(settings)
  }).then(r => r.json())

// ── Student management ────────────────────────────────────────────────────────
export const blockStudent = (telegramId) =>
  fetch(`${BASE_URL}/api/students/${telegramId}/block`, {
    method: "POST",
    headers: getAuthHeaders()
  }).then(r => r.json())

export const deleteStudent = (telegramId) =>
  fetch(`${BASE_URL}/api/students/${telegramId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  }).then(r => r.json())

// ── Services API ──────────────────────────────────────────────────────────────
export const getServices = () =>
  fetch(`${BASE_URL}/api/services`, { headers: getAuthHeaders() }).then(r => r.json())

export const createService = (data) =>
  fetch(`${BASE_URL}/api/services`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(r => r.json())

export const updateService = (id, data) =>
  fetch(`${BASE_URL}/api/services/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(r => r.json())

export const toggleService = (id) =>
  fetch(`${BASE_URL}/api/services/${id}/toggle`, {
    method: "POST",
    headers: getAuthHeaders()
  }).then(r => r.json())

export const deleteServiceApi = (id) =>
  fetch(`${BASE_URL}/api/services/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  }).then(r => r.json())

// ── Exams API ─────────────────────────────────────────────────────────────────
export const getExams = () =>
  fetch(`${BASE_URL}/api/exams`, { headers: getAuthHeaders() }).then(r => r.json())

export const createExam = (data) =>
  fetch(`${BASE_URL}/api/exams`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(r => r.json())

export const deleteExamApi = (id) =>
  fetch(`${BASE_URL}/api/exams/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  }).then(r => r.json())

