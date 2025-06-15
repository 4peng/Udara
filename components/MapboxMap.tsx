"use client"

import MapboxGL from "@rnmapbox/maps"
import { useRef, useState } from "react"
import { Dimensions, StyleSheet, View } from "react-native"
import { CAMPUS_CENTER, DEFAULT_MAP_STYLE, MAPBOX_ACCESS_TOKEN } from "../config/mapbox"

// Set Mapbox access token
MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN)

interface Sensor {
  id: number
  name: string
  aqi: number
  coordinates: {
    latitude: number
    longitude: number
  }
}

interface MapboxMapProps {
  sensors: Sensor[]
  onSensorPress?: (sensor: Sensor) => void
  showUserLocation?: boolean
  style?: any
  interactive?: boolean
}

const { width, height } = Dimensions.get("window")

export default function MapboxMap({
  sensors,
  onSensorPress,
  showUserLocation = false,
  style,
  interactive = true,
}: MapboxMapProps) {
  const mapRef = useRef<MapboxGL.MapView>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "#4CAF50" // Good - Green
    if (aqi <= 100) return "#FF9800" // Moderate - Orange
    if (aqi <= 150) return "#F44336" // Unhealthy - Red
    return "#9C27B0" // Very Unhealthy - Purple
  }

  const handleSensorPress = (sensor: Sensor) => {
    if (onSensorPress) {
      onSensorPress(sensor)
    }
  }

  const renderSensorMarkers = () => {
    return sensors.map((sensor) => (
      <MapboxGL.PointAnnotation
        key={sensor.id}
        id={`sensor-${sensor.id}`}
        coordinate={[sensor.coordinates.longitude, sensor.coordinates.latitude]}
        onSelected={() => handleSensorPress(sensor)}
      >
        <View style={[styles.markerContainer, { backgroundColor: getAQIColor(sensor.aqi) }]}>
          <View style={styles.markerInner}>
            <View style={[styles.markerDot, { backgroundColor: getAQIColor(sensor.aqi) }]} />
          </View>
        </View>
      </MapboxGL.PointAnnotation>
    ))
  }

  return (
    <View style={[styles.container, style]}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={DEFAULT_MAP_STYLE}
        onDidFinishLoadingMap={() => setIsMapReady(true)}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
      >
        <MapboxGL.Camera
          centerCoordinate={[CAMPUS_CENTER.longitude, CAMPUS_CENTER.latitude]}
          zoomLevel={15}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {showUserLocation && (
          <MapboxGL.UserLocation visible={true} showsUserHeadingIndicator={true} minDisplacement={1} />
        )}

        {isMapReady && renderSensorMarkers()}
      </MapboxGL.MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
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
