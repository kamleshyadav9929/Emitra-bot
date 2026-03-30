const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"
const SECRET = import.meta.env.VITE_SECRET_KEY || "emitra2025"

export const getStats = () =>
  fetch(`${BASE_URL}/api/stats`).then(r => r.json())

export const getStudents = (exam = "ALL") =>
  fetch(`${BASE_URL}/api/students?exam=${exam}`).then(r => r.json())

export const sendNotification = (exam, message) =>
  fetch(`${BASE_URL}/api/send-notification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exam, message, secret_key: SECRET })
  }).then(r => r.json())

export const getLogs = () =>
  fetch(`${BASE_URL}/api/logs`).then(r => r.json())

export const getServiceRequests = (status = "") =>
  fetch(`${BASE_URL}/api/service-requests${status ? `?status=${status}` : ""}`).then(r => r.json())

export const sendReceipt = (telegram_id, message, request_id) =>
  fetch(`${BASE_URL}/api/send-receipt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegram_id, message, request_id, secret_key: SECRET })
  }).then(r => r.json())
