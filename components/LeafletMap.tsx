import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface Sensor {
  id: string;
  name: string;
  aqi: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface LeafletMapProps {
  sensors: Sensor[];
  onSensorPress?: (sensor: Sensor) => void;
  style?: any;
}

export default function LeafletMap({ sensors, onSensorPress, style }: LeafletMapProps) {
  const webviewRef = useRef<WebView>(null);
  
  // Update markers when sensors data changes
  useEffect(() => {
    if (webviewRef.current && sensors.length > 0) {
      const script = `
        if (window.updateMapMarkers) {
          window.updateMapMarkers(${JSON.stringify(sensors)});
        }
      `;
      webviewRef.current.injectJavaScript(script);
    }
  }, [sensors]);

  // Generate the HTML for the Leaflet map (only once)
  const mapHtml = useMemo(() => {
    // Default center (UM Campus)
    const defaultLat = 3.128296;
    const defaultLng = 101.650734;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Initialize Map
          var map = L.map('map', { zoomControl: false }).setView([${defaultLat}, ${defaultLng}], 15);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);

          var currentMarkers = [];

          // Helper for AQI Color
          function getAQIColor(aqi) {
            if (aqi <= 50) return "#4CAF50"; // Good (Green)
            if (aqi <= 100) return "#FFC107"; // Moderate (Yellow)
            if (aqi <= 150) return "#FF9800"; // Unhealthy for Sensitive (Orange)
            if (aqi <= 200) return "#F44336"; // Unhealthy (Red)
            if (aqi <= 300) return "#9C27B0"; // Very Unhealthy (Purple)
            return "#795548"; // Hazardous (Brown)
          }

          // Global update function
          window.updateMapMarkers = function(sensorsData) {
            // Clear existing markers
            currentMarkers.forEach(function(marker) {
              map.removeLayer(marker);
            });
            currentMarkers = [];

            // Add new markers
            if (Array.isArray(sensorsData)) {
              var bounds = [];
              
              sensorsData.forEach(function(sensor) {
                if (sensor.coordinates && sensor.coordinates.latitude && sensor.coordinates.longitude) {
                  var color = getAQIColor(sensor.aqi);
                  
                  var marker = L.circleMarker([sensor.coordinates.latitude, sensor.coordinates.longitude], {
                    radius: 12,
                    fillColor: color,
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                  }).addTo(map);

                  // Add click handler
                  marker.on('click', function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify(sensor));
                  });
                  
                  currentMarkers.push(marker);
                  bounds.push([sensor.coordinates.latitude, sensor.coordinates.longitude]);
                }
              });

              // Fit bounds if we have markers
              if (bounds.length > 0) {
                // var group = new L.featureGroup(currentMarkers);
                // map.fitBounds(group.getBounds().pad(0.1));
                // Optional: Auto-fit bounds
              }
            }
          };

          // Initial load
          window.updateMapMarkers(${JSON.stringify(sensors)});

        </script>
      </body>
      </html>
    `;
  }, []); // Empty dependency array ensures HTML is only generated once

  const handleMessage = (event: any) => {
    try {
      if (event.nativeEvent.data && onSensorPress) {
        const sensor = JSON.parse(event.nativeEvent.data);
        onSensorPress(sensor);
      }
    } catch (e) {
      // Ignore parsing errors
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml, baseUrl: 'https://github.com' }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#4361EE" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    opacity: 0.99, // Hack to force render on Android
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
