"use client"

import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"

// Mock article content
const articleContent = {
  1: {
    title: "Understanding Air Quality Index (AQI)",
    subtitle: "Learn how AQI affects your daily life and health",
    readTime: "5 min read",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B7D8F3658-99A2-459E-9884-89EB2381A82C%7D-0Csx34KA3qjSBPEtDUAZwBljaHQhLI.png",
    content: `
The Air Quality Index (AQI) is a standardized system used to communicate how polluted the air currently is or how polluted it is forecast to become. The AQI focuses on health effects you may experience within a few hours or days after breathing polluted air.

## What is AQI?

The AQI is calculated for five major air pollutants regulated by the Clean Air Act:
- Ground-level ozone
- Particle pollution (PM2.5 and PM10)
- Carbon monoxide
- Sulfur dioxide
- Nitrogen dioxide

## AQI Categories

**Good (0-50)**: Air quality is considered satisfactory, and air pollution poses little or no risk.

**Moderate (51-100)**: Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people.

**Unhealthy for Sensitive Groups (101-150)**: Members of sensitive groups may experience health effects. The general public is not likely to be affected.

**Unhealthy (151-200)**: Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.

**Very Unhealthy (201-300)**: Health warnings of emergency conditions. The entire population is more likely to be affected.

**Hazardous (301-500)**: Health alert: everyone may experience more serious health effects.

## How to Use AQI Information

Check the daily AQI forecast in your area and plan your activities accordingly. When AQI values are above 100, air quality is considered unhealthy for sensitive groups, and you should consider limiting prolonged outdoor exertion.
    `,
  },
}

export default function ArticleScreen() {
  const { id } = useLocalSearchParams()
  const article = articleContent[id as keyof typeof articleContent]

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Article not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="bookmark-outline" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  )

  const formatContent = (content: string) => {
    return content.split("\n").map((paragraph, index) => {
      if (paragraph.startsWith("## ")) {
        return (
          <Text key={index} style={styles.heading}>
            {paragraph.replace("## ", "")}
          </Text>
        )
      } else if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
        return (
          <Text key={index} style={styles.boldText}>
            {paragraph.replace(/\*\*/g, "")}
          </Text>
        )
      } else if (paragraph.trim() === "") {
        return <View key={index} style={styles.spacer} />
      } else {
        return (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        )
      }
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: article.image }} style={styles.heroImage} />
        <View style={styles.content}>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.subtitle}>{article.subtitle}</Text>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.readTime}>{article.readTime}</Text>
          </View>
          <View style={styles.articleContent}>{formatContent(article.content)}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerBackButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: "100%",
    height: 250,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
    marginBottom: 16,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  readTime: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  articleContent: {
    marginTop: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 16,
  },
  boldText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    lineHeight: 24,
    marginBottom: 8,
  },
  spacer: {
    height: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#4361EE",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
