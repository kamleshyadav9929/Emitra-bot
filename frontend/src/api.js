export const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "")

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, options)
  let data = null

  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return data
}

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
  requestJson(`/api/stats`, { headers: await getAuthHeaders() })

export const getStudents = async (exam = "ALL") =>
  requestJson(`/api/students?exam=${exam}`, { headers: await getAuthHeaders() })

export const addStudent = async (studentData) =>
  requestJson(`/api/students`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(studentData)
  })

export const sendNotification = async (exam, message) =>
  requestJson(`/api/send-notification`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ exam, message })
  })

export const getLogs = async () =>
  requestJson(`/api/logs`, { headers: await getAuthHeaders() })

export const getBroadcastStatus = async (jobId) =>
  requestJson(`/api/broadcast-status/${jobId}`, { headers: await getAuthHeaders() })

export const getServiceRequests = async (status = "") =>
  requestJson(`/api/service-requests${status ? `?status=${status}` : ""}`, { headers: await getAuthHeaders() })

export const sendReceipt = async (telegramId, message, requestId) =>
  requestJson(`/api/send-receipt`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ telegram_id: telegramId, message, request_id: requestId })
  })

export const getStudentDocuments = async (telegramId) =>
  requestJson(`/api/documents/${telegramId}`, { headers: await getAuthHeaders() })

export const getDocumentUrl = async (fileId) =>
  requestJson(`/api/document-url/${fileId}`, { headers: await getAuthHeaders() })


// ── Bot Settings API ──────────────────────────────────────────────────────────
export const getBotSettings = async () =>
  requestJson(`/api/bot-settings`, { headers: await getAuthHeaders() })

export const saveBotSettings = async (settings) =>
  requestJson(`/api/bot-settings`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(settings)
  })

// ── Student management ────────────────────────────────────────────────────────
export const blockStudent = async (telegramId) =>
  requestJson(`/api/students/${telegramId}/block`, {
    method: "POST",
    headers: await getAuthHeaders()
  })

export const deleteStudent = async (telegramId) =>
  requestJson(`/api/students/${telegramId}`, {
    method: "DELETE",
    headers: await getAuthHeaders()
  })

// ── Services API ──────────────────────────────────────────────────────────────
export const getServices = async () =>
  requestJson(`/api/services`, { headers: await getAuthHeaders() })

export const createService = async (data) =>
  requestJson(`/api/services`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  })

export const updateService = async (id, data) =>
  requestJson(`/api/services/${id}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  })

export const toggleService = async (id) =>
  requestJson(`/api/services/${id}/toggle`, {
    method: "POST",
    headers: await getAuthHeaders()
  })

export const deleteServiceApi = async (id) =>
  requestJson(`/api/services/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders()
  })

// ── Exams API ─────────────────────────────────────────────────────────────────
export const getExams = async () =>
  requestJson(`/api/exams`, { headers: await getAuthHeaders() })

export const createExam = async (data) =>
  requestJson(`/api/exams`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  })

export const deleteExamApi = async (id) =>
  requestJson(`/api/exams/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders()
  })


// ── Public API (No Auth Required) ─────────────────────────────────────────────
export const getPublicServices      = () => requestJson(`/api/public/services`)
export const getPublicExams         = () => requestJson(`/api/public/exams`)
export const getPublicAnnouncements = () => requestJson(`/api/public/announcements`)
export const getPublicStats         = () => requestJson(`/api/public/stats`)
export const getPublicConfig        = () => requestJson(`/api/public/config`)
export const getPublicNews          = () => requestJson(`/api/public/news`)

export const publicRegister = (data) =>
  requestJson(`/api/public/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })

export const publicCheckStatus = (phone) =>
  requestJson(`/api/public/check-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone })
  })

export const publicLogIntent = (service_name, category, phone = "WEB_ANONYMOUS") =>
  requestJson(`/api/public/log-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service_name, category, phone })
  })


// ── Exam Portal Extensions ──────────────────────────────────────────────────

export const submitFormApplication = async (formData) => {
  const response = await fetch(`${BASE_URL}/api/public/submit-application`, {
    method: "POST",
    body: formData, // browser automatically sets multipart/form-data with boundaries
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || "Failed to submit application")
  }
  return data
}

export const getFormApplicationStatus = (phone) =>
  requestJson(`/api/public/applications/${phone}`)

export const getAdminExams = async () =>
  requestJson(`/api/admin/exams`, { headers: await getAuthHeaders() })

export const createAdminExam = async (data) =>
  requestJson(`/api/admin/exams`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  })

export const updateAdminExam = async (id, data) =>
  requestJson(`/api/admin/exams/${id}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  })

export const deleteAdminExam = async (id) =>
  requestJson(`/api/exams/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders()
  })

export const getFormApplications = async (status = "") =>
  requestJson(`/api/admin/applications${status ? `?status=${status}` : ""}`, { headers: await getAuthHeaders() })

export const getApplicationDetails = async (id) =>
  requestJson(`/api/admin/applications/${id}`, { headers: await getAuthHeaders() })

export const updateApplicationStatus = async (id, data) =>
  requestJson(`/api/admin/applications/${id}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  })

export const downloadApplicationDocument = async (filename) => {
  const headers = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}/api/admin/documents/download/${filename}`, {
    headers
  })
  if (!response.ok) {
    throw new Error("Could not download file")
  }
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  // Strip the prefix (appid_uuid_) from name for user
  const cleanName = filename.split("_").slice(2).join("_") || filename
  a.download = cleanName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export const downloadPublicApplicationDocument = async (filename) => {
  const response = await fetch(`${BASE_URL}/api/public/documents/download/${filename}`)
  if (!response.ok) {
    throw new Error("Could not download file")
  }
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  // Strip the prefix (appid_uuid_) from name for user
  const cleanName = filename.split("_").slice(2).join("_") || filename
  a.download = cleanName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}


