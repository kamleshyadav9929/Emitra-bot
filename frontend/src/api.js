export const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "")

const getAuthHeaders = async () => {
  let token = null;
  if (window.Clerk && window.Clerk.session) {
    try {
      token = await window.Clerk.session.getToken();
    } catch (e) {
      console.error("Error getting Clerk token", e);
    }
  }
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  }
}

export const getStats = async () =>
  fetch(`${BASE_URL}/api/stats`, { headers: await getAuthHeaders() }).then(r => r.json())

export const getStudents = async (exam = "ALL") =>
  fetch(`${BASE_URL}/api/students?exam=${exam}`, { headers: await getAuthHeaders() }).then(r => r.json())

export const addStudent = async (studentData) =>
  fetch(`${BASE_URL}/api/students`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(studentData)
  }).then(r => r.json())

export const sendNotification = async (exam, message) =>
  fetch(`${BASE_URL}/api/send-notification`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ exam, message })
  }).then(r => r.json())

export const getLogs = async () =>
  fetch(`${BASE_URL}/api/logs`, { headers: await getAuthHeaders() }).then(r => r.json())

export const getServiceRequests = async (status = "") =>
  fetch(`${BASE_URL}/api/service-requests${status ? `?status=${status}` : ""}`, { headers: await getAuthHeaders() }).then(r => r.json())

export const sendReceipt = async (telegramId, message, requestId) =>
  fetch(`${BASE_URL}/api/send-receipt`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ telegram_id: telegramId, message, request_id: requestId })
  }).then(r => r.json())

export const getStudentDocuments = async (telegramId) =>
  fetch(`${BASE_URL}/api/documents/${telegramId}`, { headers: await getAuthHeaders() }).then(r => r.json())

export const getDocumentUrl = async (fileId) =>
  fetch(`${BASE_URL}/api/document-url/${fileId}`, { headers: await getAuthHeaders() }).then(r => r.json())


// ── Bot Settings API ──────────────────────────────────────────────────────────
export const getBotSettings = async () =>
  fetch(`${BASE_URL}/api/bot-settings`, { headers: await getAuthHeaders() }).then(r => r.json())

export const saveBotSettings = async (settings) =>
  fetch(`${BASE_URL}/api/bot-settings`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(settings)
  }).then(r => r.json())

// ── Student management ────────────────────────────────────────────────────────
export const blockStudent = async (telegramId) =>
  fetch(`${BASE_URL}/api/students/${telegramId}/block`, {
    method: "POST",
    headers: await getAuthHeaders()
  }).then(r => r.json())

export const deleteStudent = async (telegramId) =>
  fetch(`${BASE_URL}/api/students/${telegramId}`, {
    method: "DELETE",
    headers: await getAuthHeaders()
  }).then(r => r.json())

// ── Services API ──────────────────────────────────────────────────────────────
export const getServices = async () =>
  fetch(`${BASE_URL}/api/services`, { headers: await getAuthHeaders() }).then(r => r.json())

export const createService = async (data) =>
  fetch(`${BASE_URL}/api/services`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(r => r.json())

export const updateService = async (id, data) =>
  fetch(`${BASE_URL}/api/services/${id}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(r => r.json())

export const toggleService = async (id) =>
  fetch(`${BASE_URL}/api/services/${id}/toggle`, {
    method: "POST",
    headers: await getAuthHeaders()
  }).then(r => r.json())

export const deleteServiceApi = async (id) =>
  fetch(`${BASE_URL}/api/services/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders()
  }).then(r => r.json())

// ── Exams API ─────────────────────────────────────────────────────────────────
export const getExams = async () =>
  fetch(`${BASE_URL}/api/exams`, { headers: await getAuthHeaders() }).then(r => r.json())

export const createExam = async (data) =>
  fetch(`${BASE_URL}/api/exams`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(r => r.json())

export const deleteExamApi = async (id) =>
  fetch(`${BASE_URL}/api/exams/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders()
  }).then(r => r.json())


// ── Public API (No Auth Required) ─────────────────────────────────────────────
export const getPublicServices      = () => fetch(`${BASE_URL}/api/public/services`).then(r => r.json())
export const getPublicExams         = () => fetch(`${BASE_URL}/api/public/exams`).then(r => r.json())
export const getPublicAnnouncements = () => fetch(`${BASE_URL}/api/public/announcements`).then(r => r.json())
export const getPublicStats         = () => fetch(`${BASE_URL}/api/public/stats`).then(r => r.json())
export const getPublicConfig        = () => fetch(`${BASE_URL}/api/public/config`).then(r => r.json())
export const getPublicNews          = () => fetch(`${BASE_URL}/api/public/news`).then(r => r.json())

export const publicRegister = (data) =>
  fetch(`${BASE_URL}/api/public/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(r => r.json())

export const publicCheckStatus = (phone) =>
  fetch(`${BASE_URL}/api/public/check-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone })
  }).then(r => r.json())

export const publicLogIntent = (service_name, category) =>
  fetch(`${BASE_URL}/api/public/log-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service_name, category })
  }).then(r => r.json())
