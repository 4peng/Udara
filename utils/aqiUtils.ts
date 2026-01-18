export interface AQICategory {
  name: string
  range: string
  color: string
  description: string
  minValue: number
  maxValue: number
}

// Official Malaysian API Categories (5 Levels)
export const AQI_CATEGORIES: AQICategory[] = [
  {
    name: "Good",
    range: "0-50",
    color: "#4CAF50", // Green
    description: "Air quality is good. Pollution poses little or no risk.",
    minValue: 0,
    maxValue: 50,
  },
  {
    name: "Moderate",
    range: "51-100",
    color: "#FFC107", // Yellow
    description: "Air quality is acceptable. Moderate health concern for a very small number of people.",
    minValue: 51,
    maxValue: 100,
  },
  {
    name: "Unhealthy",
    range: "101-200",
    color: "#FF9800", // Orange
    description: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.",
    minValue: 101,
    maxValue: 200,
  },
  {
    name: "Very Unhealthy",
    range: "201-300",
    color: "#F44336", // Red
    description: "Health warnings of emergency conditions. The entire population is more likely to be affected.",
    minValue: 201,
    maxValue: 300,
  },
  {
    name: "Hazardous",
    range: "300+",
    color: "#9C27B0", // Purple
    description: "Health alert: everyone may experience more serious health effects.",
    minValue: 301,
    maxValue: 500,
  },
]

export const getAQICategory = (aqi: number): AQICategory => {
  // Ensure AQI is within valid range
  const validAQI = Math.max(0, aqi)
  
  if (validAQI <= 50) return AQI_CATEGORIES[0];
  if (validAQI <= 100) return AQI_CATEGORIES[1];
  if (validAQI <= 200) return AQI_CATEGORIES[2];
  if (validAQI <= 300) return AQI_CATEGORIES[3];
  return AQI_CATEGORIES[4];
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

// Simplified categories for filters if needed (mapping 5 levels to 3 groups for UI simplicity if requested)
// But sticking to strict categories is better for accuracy.
export const SIMPLE_AQI_CATEGORIES = AQI_CATEGORIES;

// Helper function to validate AQI value
export const validateAQI = (aqi: number): number => {
  if (typeof aqi !== 'number' || isNaN(aqi)) {
    return 0 // Default to 0 if invalid
  }
  return Math.max(0, Math.round(aqi))
}

// Helper function to get AQI level for filtering
export const getAQILevel = (aqi: number): 'good' | 'moderate' | 'unhealthy' => {
  const validAQI = validateAQI(aqi)
  
  if (validAQI <= 50) return 'good';
  if (validAQI <= 100) return 'moderate';
  return 'unhealthy';
}