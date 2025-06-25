export interface AQICategory {
  name: string
  range: string
  color: string
  description: string
  minValue: number
  maxValue: number
}

// Simplified 3-color AQI system
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
    name: "Hazardous",
    range: "201+",
    color: "#F44336", // Red
    description: "Air quality is unhealthy and may cause health effects for everyone.",
    minValue: 201,
    maxValue: 500,
  },
]

export const getAQICategory = (aqi: number): AQICategory => {
  for (const category of AQI_CATEGORIES) {
    if (aqi >= category.minValue && aqi <= category.maxValue) {
      return category
    }
  }
  // Return the highest category for values above 500
  return AQI_CATEGORIES[AQI_CATEGORIES.length - 1]
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
    name: "Hazardous",
    range: "201+",
    color: "#F44336",
    filter: "hazardous",
  },
]
