"use client"

import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { CAMPUS_CENTER, DEFAULT_MAP_STYLE, MAPBOX_ACCESS_TOKEN, MAPBOX_STATUS } from "../config/mapbox"
import FallbackMap from "./FallbackMap"

// Import Mapbox components
let MapboxGL: any = null
let MapView: any = null
let Camera: any = null
let PointAnnotation: any = null
let UserLocation: any = null
let mapboxImportError: any = null

try {
  if (MAPBOX_STATUS.isAvailable) {
    const MapboxModule = require("@rnmapbox/maps")
    
    MapboxGL = MapboxModule.default
    MapView = MapboxModule.MapView
    Camera = MapboxModule.Camera
    PointAnnotation = MapboxModule.PointAnnotation
    UserLocation = MapboxModule.UserLocation
    
    MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN)
  }
} catch (error) {
  mapboxImportError = error
}

interface Sensor {
  id: string
  name: string
  aqi: number
  coordinates: {
    latitude: number
    longitude: number
  }
  location?: string
  deviceId?: string
}

interface MapboxMapProps {
  sensors: Sensor[]
  onSensorPress?: (sensor: Sensor) => void
  showUserLocation?: boolean
  style?: any
  interactive?: boolean
}

export default function MapboxMap({
  sensors,
  onSensorPress,
  showUserLocation = false,
  style,
  interactive = true,
}: MapboxMapProps) {
  const mapRef = useRef<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [useMapbox, setUseMapbox] = useState<boolean | null>(null)

  useEffect(() => {
    if (mapboxImportError || !MapboxGL || !MapView || !Camera || !PointAnnotation) {
      setUseMapbox(false)
      return
    }
    setUseMapbox(true)
  }, [])

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "#4CAF50"
    if (aqi <= 100) return "#FF9800"
    if (aqi <= 150) return "#F44336"
    return "#9C27B0"
  }

  const handleSensorPress = (sensor: Sensor) => {
    if (onSensorPress) {
      onSensorPress(sensor)
    }
  }

  const handleMapReady = () => {
    setIsMapReady(true)
    setMapError(null)
  }

  const handleMapError = (error: any) => {
    const errorMessage = error?.message || error?.toString() || "Unknown map error"
    setMapError(errorMessage)
    setUseMapbox(false)
  }

  if (useMapbox === null) {
    return (
      <View style={[styles.container, style, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    )
  }

  if (!useMapbox || mapError) {
    return <FallbackMap sensors={sensors} onSensorPress={onSensorPress} style={style} />
  }

  const renderSensorMarkers = () => {
    if (!Array.isArray(sensors) || !PointAnnotation) {
      return null
    }

    return sensors
      .map((sensor, index) => {
        if (
          !sensor ||
          !sensor.coordinates ||
          typeof sensor.coordinates.latitude !== "number" ||
          typeof sensor.coordinates.longitude !== "number" ||
          isNaN(sensor.coordinates.latitude) ||
          isNaN(sensor.coordinates.longitude)
        ) {
          return null
        }

        const aqi = typeof sensor.aqi === "number" ? sensor.aqi : 0

        try {
          return (
            <PointAnnotation
              key={sensor.id}
              id={`sensor-${sensor.id}`}
              coordinate={[sensor.coordinates.latitude, sensor.coordinates.longitude]}
              onSelected={() => handleSensorPress(sensor)}
            >
              <View style={[styles.markerContainer, { backgroundColor: getAQIColor(aqi) }]}>
                <View style={styles.markerInner}>
                  <View style={[styles.markerDot, { backgroundColor: getAQIColor(aqi) }]} />
                </View>
              </View>
            </PointAnnotation>
          )
        } catch (error) {
          return null
        }
      })
      .filter(Boolean)
  }

  const getMapCenter = () => {
    if (!Array.isArray(sensors) || sensors.length === 0) {
      return [CAMPUS_CENTER.longitude, CAMPUS_CENTER.latitude]
    }

    const validSensors = sensors.filter(
      (s) =>
        s &&
        s.coordinates &&
        typeof s.coordinates.latitude === "number" &&
        typeof s.coordinates.longitude === "number" &&
        !isNaN(s.coordinates.latitude) &&
        !isNaN(s.coordinates.longitude),
    )

    if (validSensors.length === 0) {
      return [CAMPUS_CENTER.longitude, CAMPUS_CENTER.latitude]
    }

    // Workaround: Database has lat/lng swapped, so we swap them back
    const avgLat = validSensors.reduce((sum, s) => sum + s.coordinates.longitude, 0) / validSensors.length
    const avgLng = validSensors.reduce((sum, s) => sum + s.coordinates.latitude, 0) / validSensors.length

    return [avgLng, avgLat]
  }

  try {
    const mapCenter = getMapCenter()

    return (
      <View style={[styles.container, style]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          styleURL={DEFAULT_MAP_STYLE}
          onDidFinishLoadingMap={handleMapReady}
          onDidFailLoadingMap={handleMapError}
          scrollEnabled={interactive}
          zoomEnabled={interactive}
          rotateEnabled={interactive}
          pitchEnabled={interactive}
        >
          <Camera
            centerCoordinate={mapCenter}
            zoomLevel={12}
            animationMode="none"
          />

          {showUserLocation && UserLocation && (
            <UserLocation visible={true} showsUserHeadingIndicator={true} minDisplacement={1} />
          )}

          {isMapReady && renderSensorMarkers()}
        </MapView>
      </View>
    )
  } catch (error) {
    return <FallbackMap sensors={sensors} onSensorPress={onSensorPress} style={style} />
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
})