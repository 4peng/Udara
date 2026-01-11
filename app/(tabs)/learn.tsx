"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"

const categories = ["Basics of Air Quality", "Health Effects", "Prevention", "Guides"]

const featuredArticle = {
  id: 1,
  title: "Understanding Air Quality Index (AQI)",
  subtitle: "Learn how AQI affects your daily life and health",
  readTime: "5 min read",
  image:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B7D8F3658-99A2-459E-9884-89EB2381A82C%7D-0Csx34KA3qjSBPEtDUAZwBljaHQhLI.png",
  category: "Basics of Air Quality",
}

const articles = [
  {
    id: 2,
    title: "Indoor Air Quality Guide",
    description: "Essential tips for maintaining clean indoor air in your home and workplace",
    readTime: "4 min read",
    category: "Indoor Air",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop",
    tags: ["Indoor Air", "Tips"],
  },
  {
    id: 3,
    title: "Air Pollution Sources",
    description: "Common sources of air pollution and their impact on health",
    readTime: "6 min read",
    category: "Basics",
    image: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=200&fit=crop",
    tags: ["Basics", "Pollution"],
  },
  {
    id: 4,
    title: "Protective Measures",
    description: "How to protect yourself from poor air quality",
    readTime: "3 min read",
    category: "Health",
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&h=200&fit=crop",
    tags: ["Health", "Protection"],
  },
  {
    id: 5,
    title: "Air Quality Testing",
    description: "Guide to testing and monitoring air quality in your environment",
    readTime: "5 min read",
    category: "Guides",
    image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=200&fit=crop",
    tags: ["Guides", "Testing"],
  },
  {
    id: 6,
    title: "Seasonal Air Quality Changes",
    description: "How air quality varies throughout the year and what to expect",
    readTime: "4 min read",
    category: "Basics",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop",
    tags: ["Basics", "Seasonal"],
  },
  {
    id: 7,
    title: "Air Quality and Exercise",
    description: "Best practices for outdoor activities during different air quality conditions",
    readTime: "6 min read",
    category: "Health",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop",
    tags: ["Health", "Exercise"],
  },
]

export default function LearnScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  const getFilteredArticles = () => {
    let filtered = articles

    if (searchQuery) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (article) => article.category === selectedCategory || article.tags.includes(selectedCategory),
      )
    }

    return filtered
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={{ width: 40 }} /> 
      <Text style={styles.headerTitle}>Learn</Text>
      <TouchableOpacity style={styles.searchButton}>
        <Ionicons name="search-outline" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  )

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )

  const renderFeaturedArticle = () => (
    <TouchableOpacity style={styles.featuredCard} onPress={() => router.push(`/learn/${featuredArticle.id}`)}>
      <Image source={{ uri: featuredArticle.image }} style={styles.featuredImage} />
      <View style={styles.featuredContent}>
        <Text style={styles.featuredTitle}>{featuredArticle.title}</Text>
        <Text style={styles.featuredSubtitle}>{featuredArticle.subtitle}</Text>
        <View style={styles.featuredMeta}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.readTime}>{featuredArticle.readTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderCategoryTabs = () => (
    <View style={styles.categoryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollView}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryTab, selectedCategory === category && styles.categoryTabActive]}
            onPress={() => setSelectedCategory(selectedCategory === category ? "" : category)}
          >
            <Text style={[styles.categoryTabText, selectedCategory === category && styles.categoryTabTextActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  const renderArticleGrid = () => {
    const filteredArticles = getFilteredArticles()

    if (filteredArticles.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No articles found</Text>
          <Text style={styles.emptyStateSubtext}>Try adjusting your search or category filter</Text>
        </View>
      )
    }

    return (
      <View style={styles.articlesGrid}>
        {filteredArticles.map((article, index) => (
          <TouchableOpacity
            key={article.id}
            style={[styles.articleCard, index % 2 === 0 ? styles.articleCardLeft : styles.articleCardRight]}
            onPress={() => router.push(`/learn/${article.id}`)}
          >
            <Image source={{ uri: article.image }} style={styles.articleImage} />
            <View style={styles.articleContent}>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleDescription} numberOfLines={3}>
                {article.description}
              </Text>
              <View style={styles.articleMeta}>
                <Text style={styles.articleReadTime}>{article.readTime}</Text>
                <Text style={styles.articleCategory}>{article.category}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSearchBar()}
        {renderFeaturedArticle()}
        {renderCategoryTabs()}
        {renderArticleGrid()}
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  searchButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  featuredCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredImage: {
    width: "100%",
    height: 200,
  },
  featuredContent: {
    padding: 20,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  featuredSubtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
    marginBottom: 12,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  readTime: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  categoryContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  categoryScrollView: {
    paddingHorizontal: 20,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 12,
  },
  categoryTabActive: {
    backgroundColor: "#4361EE",
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  categoryTabTextActive: {
    color: "#FFFFFF",
  },
  articlesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  articleCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  articleCardLeft: {
    marginRight: "4%",
  },
  articleCardRight: {
    marginLeft: 0,
  },
  articleImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  articleContent: {
    padding: 12,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    lineHeight: 18,
  },
  articleDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
    marginBottom: 8,
  },
  articleMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  articleReadTime: {
    fontSize: 11,
    color: "#999",
  },
  articleCategory: {
    fontSize: 10,
    color: "#4361EE",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#666",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
})