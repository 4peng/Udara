// Mapbox configuration
export const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoiYWx1dGZpdW0iLCJhIjoiY205MWhxNDhwMDEzaTJscHlnaThoOTNrOSJ9.DDN2zRfCJY9D8h6fhG1b3w"

// Default map settings
export const DEFAULT_MAP_STYLE = "mapbox://styles/mapbox/light-v11"

// Campus coordinates (example - replace with your actual campus coordinates)
export const CAMPUS_CENTER = {
  latitude: 34.0522,
  longitude: -118.2437,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
}

// Sample sensor locations with coordinates
export const SENSOR_LOCATIONS = [
  {
    id: 1,
    name: "Main Library - Floor 1",
    location: "Library Plaza",
    aqi: 42,
    status: "good",
    coordinates: {
      latitude: 34.0525,
      longitude: -118.244,
    },
    isMonitored: true,
  },
  {
    id: 2,
    name: "Student Center - West Wing",
    location: "Student Center",
    aqi: 45,
    status: "good",
    coordinates: {
      latitude: 34.052,
      longitude: -118.2435,
    },
    isMonitored: true,
  },
  {
    id: 3,
    name: "Science Building - Lab Area",
    location: "Academic Buildings",
    aqi: 38,
    status: "good",
    coordinates: {
      latitude: 34.0518,
      longitude: -118.2442,
    },
    isMonitored: false,
  },
  {
    id: 4,
    name: "Sports Complex - Indoor",
    location: "Sports Complex",
    aqi: 75,
    status: "moderate",
    coordinates: {
      latitude: 34.0528,
      longitude: -118.243,
    },
    isMonitored: false,
  },
  {
    id: 5,
    name: "Engineering Building - Floor 2",
    location: "Academic Buildings",
    aqi: 125,
    status: "unhealthy",
    coordinates: {
      latitude: 34.0515,
      longitude: -118.2445,
    },
    isMonitored: false,
  },
  {
    id: 6,
    name: "Dormitory Area - Common Room",
    location: "Dormitory Area",
    aqi: 35,
    status: "good",
    coordinates: {
      latitude: 34.053,
      longitude: -118.2425,
    },
    isMonitored: false,
  },
]
