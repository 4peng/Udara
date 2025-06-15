export const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoiYWx1dGZpdW0iLCJhIjoiY205MWhxNDhwMDEzaTJscHlnaThoOTNrOSJ9.DDN2zRfCJY9D8h6fhG1b3w"

export const DEFAULT_MAP_STYLE = "mapbox://styles/mapbox/light-v11"

export const CAMPUS_CENTER = {
  latitude: 3.128296,
  longitude: 101.650734,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
}

export const checkMapboxAvailability = () => {
  const hasValidToken = MAPBOX_ACCESS_TOKEN && 
                       MAPBOX_ACCESS_TOKEN.startsWith("pk.") && 
                       MAPBOX_ACCESS_TOKEN.length > 50 &&
                       MAPBOX_ACCESS_TOKEN !== "your_mapbox_token_here"

  let mapboxImportable = false
  let mapboxError = null

  try {
    const MapboxModule = require("@rnmapbox/maps")
    mapboxImportable = true
    
    try {
      MapboxModule.default.setAccessToken(MAPBOX_ACCESS_TOKEN)
    } catch (tokenError) {
      mapboxError = tokenError
    }
    
  } catch (error) {
    mapboxError = error
  }

  const isAvailable = hasValidToken && mapboxImportable

  return {
    isAvailable,
    hasValidToken,
    mapboxImportable,
    error: mapboxError,
    reasons: {
      noToken: !hasValidToken,
      cantImport: !mapboxImportable,
    },
  }
}

export const MAPBOX_STATUS = checkMapboxAvailability()
export const MAPBOX_AVAILABLE = MAPBOX_STATUS.isAvailable

export const testMapboxToken = async () => {
  if (!MAPBOX_ACCESS_TOKEN) {
    return false
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`
    )
    
    if (response.ok) {
      return true
    } else {
      return false
    }
  } catch (error) {
    return false
  }
}