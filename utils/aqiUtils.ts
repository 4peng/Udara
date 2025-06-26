export interface AQICategory {
  name: string
  range: string
  color: string
  description: string
  minValue: number
  maxValue: number
}

// Simplified 3-level AQI system: Healthy, Moderate, Unhealthy
export const AQI_CATEGORIES: AQICategory[] = [
  {
    name: "Healthy",
    range: "0-100",
    color: "#4CAF50", // Green
    description: "Air quality is satisfactory and poses little or no health risk.",
    minValue: 0,
    maxValue: 100,
  },
  {
    name: "Moderate",
    range: "101-200",
    color: "#FFC107", // Yellow/Amber
    description: "Air quality is acceptable for most people, but sensitive individuals may experience minor symptoms.",
    minValue: 101,
    maxValue: 200,
  },
  {
    name: "Unhealthy",
    range: "201+",
    color: "#F44336", // Red
    description: "Air quality is unhealthy and may cause health effects for everyone.",
    minValue: 201,
    maxValue: 500,
  },
]

export const getAQICategory = (aqi: number): AQICategory => {
  // Ensure AQI is within valid range
  const validAQI = Math.max(0, Math.min(500, aqi))
  
  if (validAQI <= 100) {
    return AQI_CATEGORIES[0] // Healthy
  } else if (validAQI <= 200) {
    return AQI_CATEGORIES[1] // Moderate
  } else {
    return AQI_CATEGORIES[2] // Unhealthy
  }
}

export const getAQIColor = (aqi: number): string => {
  return getAQICategory(aqi).color
}

export const getAQIStatus = (aqi: number): string => {
  return getAQICategory(aqi).name
}

export const getAQIDescription = (aqi: number): string => {
  return getAQICategory(aqi).description
}

// Simplified categories for filters and displays
export const SIMPLE_AQI_CATEGORIES = [
  {
    name: "Healthy",
    range: "0-100",
    color: "#4CAF50",
    filter: "healthy",
  },
  {
    name: "Moderate",
    range: "101-200",
    color: "#FFC107",
    filter: "moderate",
  },
  {
    name: "Unhealthy",
    range: "201+",
    color: "#F44336",
    filter: "unhealthy",
  },
]

// Helper function to validate AQI value
export const validateAQI = (aqi: number): number => {
  if (typeof aqi !== 'number' || isNaN(aqi)) {
    return 50 // Default to healthy if invalid
  }
  return Math.max(0, Math.min(500, Math.round(aqi)))
}

// Helper function to get AQI level for filtering
export const getAQILevel = (aqi: number): 'healthy' | 'moderate' | 'unhealthy' => {
  const validAQI = validateAQI(aqi)
  
  if (validAQI <= 100) {
    return 'healthy'
  } else if (validAQI <= 200) {
    return 'moderate'
  } else {
    return 'unhealthy'
  }
}