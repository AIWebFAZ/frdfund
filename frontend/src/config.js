// API Configuration
// ใช้ empty string เพื่อให้เป็น relative path (/api)
// เมื่อรัน production ใน Docker, nginx จะ proxy /api ไปหา backend
// เมื่อรัน dev mode, ใช้ http://localhost:3000
const API_URL = import.meta.env.VITE_API_URL || ''

export const getApiUrl = () => API_URL

export default {
  API_URL,
  getApiUrl
}
