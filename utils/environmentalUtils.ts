
// Helper functions for environmental analysis

export const getComfortLevel = (temp: number | undefined | null, humidity: number | undefined | null): string => {
  if (temp === undefined || temp === null || humidity === undefined || humidity === null) return 'Unknown'
  
  if (temp >= 20 && temp <= 26 && humidity >= 40 && humidity <= 70) {
    return 'Good'
  } else if (temp > 30 || humidity > 80) {
    return 'Poor'
  } else if (temp < 18 || humidity < 30) {
    return 'Dry/Cold'
  } else {
    return 'Fair'
  }
}

export const getComfortLevelColor = (temp: number | undefined | null, humidity: number | undefined | null): string => {
  const level = getComfortLevel(temp, humidity)
  switch (level) {
    case 'Good': return '#4CAF50'
    case 'Fair': return '#FFC107'
    case 'Poor': return '#FF5722'
    case 'Dry/Cold': return '#2196F3'
    default: return '#666'
  }
}

export const calculateHeatIndex = (temp: number | undefined | null, humidity: number | undefined | null): string => {
  if (temp === undefined || temp === null || humidity === undefined || humidity === null) return 'N/A'
  
  // Simplified heat index calculation
  if (temp < 27) return temp.toFixed(1)
  
  const c1 = -8.78469475556
  const c2 = 1.61139411
  const c3 = 2.33854883889
  const c4 = -0.14611605
  const c5 = -0.012308094
  const c6 = -0.0164248277778
  const c7 = 0.002211732
  const c8 = 0.00072546
  const c9 = -0.000003582
  
  const heatIndex = c1 + (c2 * temp) + (c3 * humidity) + 
                   (c4 * temp * humidity) + (c5 * temp * temp) + 
                   (c6 * humidity * humidity) + (c7 * temp * temp * humidity) + 
                   (c8 * temp * humidity * humidity) + (c9 * temp * temp * humidity * humidity)
  
  return Math.max(temp, heatIndex).toFixed(1)
}
