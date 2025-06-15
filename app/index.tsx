"use client"

import { router } from "expo-router"
import { useEffect } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { useAuth } from "../hooks/useAuth"

export default function Index() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/(tabs)")
      } else {
        router.replace("/(auth)/login")
      }
    }
  }, [user, loading])

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4361EE" />
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
})
