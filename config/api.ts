import { Platform } from "react-native"

// API Configuration
export const API_CONFIG = {
  BASE_URL: "https://udara.onrender.com",
  // BASE_URL: "http://192.168.100.39:4000", 
  ENDPOINTS: {
    DEVICES: "/api/sensor/dashboard", // Updated to new dashboard endpoint
    DEVICE_DETAIL: (deviceId: string) => `/api/sensor/${deviceId}/latest`, // Updated to latest reading
    DEVICE_HISTORY: (deviceId: string, period = "24") => `/api/sensor/${deviceId}/trends?hours=${period.replace('h', '')}`,
    LOGS: "/api/logs",
    USER: "/api/user",
    AIR_QUALITY: "/api/air-quality",
    SENSOR: "/api/sensor",
    CSV_UPLOAD: "/api/csv-upload",
    NOTIFICATIONS: {
      REGISTER: "/api/notifications/register",
      SUBSCRIBE: "/api/notifications/subscribe",
      UNSUBSCRIBE: "/api/notifications/unsubscribe",
      SUBSCRIPTIONS: (userId: string) => `/api/notifications/subscriptions/${userId}`,
      GET_ALL: (userId: string) => `/api/notifications/${userId}/notifications`, // Updated
    },
    HEALTH: "/api/health",
  },

  // Request timeout in milliseconds
  TIMEOUT: 30000,
}

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// Helper function for API requests with timeout
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

  console.log(`📡 API Request: ${options.method || 'GET'} ${url}`)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    console.error(`❌ API Request Error (${url}):`, error)
    throw error
  }
}