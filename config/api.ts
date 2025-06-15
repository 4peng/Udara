// API Configuration
export const API_CONFIG = {
    // Update this URL based on your setup:
  
    // For local development (backend running on localhost)
    BASE_URL: "http://10.0.2.2:3001",
  
    // For deployed backend (uncomment and update when you deploy)
    // BASE_URL: "https://your-backend-url.com",
  
    // For ngrok testing (uncomment and update when using ngrok)
    // BASE_URL: "https://abc123.ngrok.io",
  
    ENDPOINTS: {
      DEVICES: "/api/devices",
      DEVICE_DETAIL: (deviceId: string) => `/api/devices/${deviceId}`,
      HEALTH: "/health",
    },
  
    // Request timeout in milliseconds
    TIMEOUT: 10000,
  }
  
  // Helper function to build full URL
  export const buildApiUrl = (endpoint: string): string => {
    return `${API_CONFIG.BASE_URL}${endpoint}`
  }
  
  // Helper function for API requests with timeout
  export const apiRequest = async (url: string, options: RequestInit = {}) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)
  
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
      throw error
    }
  }
  