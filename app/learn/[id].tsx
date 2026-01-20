"use client"

import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams, Stack } from "expo-router"
import { useState, useEffect } from "react"
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Mock article content with high-quality images
const articleContent = {
  1: {
    title: "Understanding Air Quality Index (AQI)",
    subtitle: "Learn how AQI affects your daily life and health",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=800&fit=crop",
    content: "\nThe Air Quality Index (AQI) is a standardized system used to communicate how polluted the air currently is or how polluted it is forecast to become. The AQI focuses on health effects you may experience within a few hours or days after breathing polluted air.\n\n## What is AQI?\n\nThe AQI is calculated for five major air pollutants regulated by the Clean Air Act:\n- Ground-level ozone\n- Particle pollution (PM2.5 and PM10)\n- Carbon monoxide\n- Sulfur dioxide\n- Nitrogen dioxide\n\n## AQI Categories\n\n**Good (0-50)**: Air quality is considered satisfactory, and air pollution poses little or no risk.\n\n**Moderate (51-100)**: Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people.\n\n**Unhealthy for Sensitive Groups (101-150)**: Members of sensitive groups may experience health effects. The general public is not likely to be affected.\n\n**Unhealthy (151-200)**: Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.\n\n**Very Unhealthy (201-300)**: Health warnings of emergency conditions. The entire population is more likely to be affected.\n\n**Hazardous (301-500)**: Health alert: everyone may experience more serious health effects.\n\n## How to Use AQI Information\n\nCheck the daily AQI forecast in your area and plan your activities accordingly. When AQI values are above 100, air quality is considered unhealthy for sensitive groups, and you should consider limiting prolonged outdoor exertion.\n    ",
  },
  2: {
    title: "Indoor Air Quality Guide",
    subtitle: "Essential tips for maintaining clean indoor air in your home and workplace",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&fit=crop",
    content: `
Many people don't realize that indoor air can be significantly more polluted than outdoor air. Since we spend about 90% of our time indoors, maintaining good indoor air quality (IAQ) is crucial for health.

## Common Indoor Pollutants

- **Volatile Organic Compounds (VOCs)**: Emitted from paints, solvents, and cleaning supplies.
- **Dust Mites and Mold**: Common allergens that thrive in humid environments.
- **Pet Dander**: Fur and skin flakes from household pets.
- **Carbon Monoxide**: A colorless, odorless gas from faulty combustion appliances.

## Tips for Improvement

**Ventilation is Key**: Open windows regularly to allow fresh air to circulate, unless outdoor air quality is poor.

**Control Humidity**: Keep indoor humidity between 30-50% to prevent mold growth and discourage dust mites.

**Use Air Purifiers**: HEPA filters can effectively remove particles like dust, pollen, and pet dander.

**Keep it Clean**: Regular vacuuming with a HEPA-filter vacuum and dusting reduces airborne allergens.

**Plants**: Some houseplants, like spider plants and peace lilies, can help filter out certain pollutants naturally.
    `,
  },
  3: {
    title: "Air Pollution Sources",
    subtitle: "Common sources of air pollution and their impact on health",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&fit=crop",
    content: `
Air pollution comes from many different sources, both natural and man-made. Understanding these sources is the first step in reducing exposure.

## Mobile Sources

Vehicles such as cars, buses, planes, trucks, and trains are the most common source of air pollution. They release nitrogen oxides and particulate matter, which are major contributors to smog and poor respiratory health.

## Stationary Sources

Power plants, oil refineries, industrial facilities, and factories emit large quantities of pollutants. These include sulfur dioxide and particulate matter.

## Area Sources

Agricultural areas, cities, and wood-burning fireplaces are considered "area sources." While individually small, collectively they contribute significantly to local pollution levels.

## Natural Sources

- **Wind-blown dust**: From dry regions and construction sites.
- **Wildfires**: Release massive amounts of smoke and particulate matter.
- **Volcanoes**: Emit sulfur dioxide and ash.

## Reducing Your Contribution

Simple actions like carpooling, using public transport, conserving energy at home, and avoiding burning trash can help reduce overall pollution levels.
    `,
  },
  4: {
    title: "Protective Measures",
    subtitle: "How to protect yourself from poor air quality",
    readTime: "3 min read",
    image: "https://images.pexels.com/photos/3951881/pexels-photo-3951881.jpeg?auto=compress&cs=tinysrgb&w=800",
    content: `
When air quality reaches unhealthy levels, taking immediate protective steps can prevent short-term symptoms and long-term health issues.

## Check Daily Forecasts

Make it a habit to check the Air Quality Index (AQI) daily. Apps like Udara provide real-time updates and alerts for your location.

## Limit Outdoor Activities

When AQI is high (above 100 or 150 depending on your sensitivity):
- Reduce the intensity of outdoor activities (walk instead of run).
- Shorten the duration of your outdoor workout.
- Reschedule activities for early morning or late evening when pollution levels might be lower (though ozone is often lower in the morning, particles can be high).

## Create a Clean Room

Designate a room in your home with few windows and doors as a "clean room." Run an air purifier in this room and spend time there during pollution episodes.

## Wear Masks

If you must be outside during hazardous conditions, N95 or KN95 respirators can filter out fine particles (PM2.5). Cloth masks and surgical masks generally provide little protection against air pollution.
    `,
  },
  5: {
    title: "Air Quality Testing",
    subtitle: "Guide to testing and monitoring air quality in your environment",
    readTime: "5 min read",
    image: "https://images.pexels.com/photos/3735709/pexels-photo-3735709.jpeg?auto=compress&cs=tinysrgb&w=800",
    content: `
Monitoring the air you breathe is empowering. Here's how you can test and track air quality in your immediate environment.

## Consumer Air Quality Monitors

Devices like the ones connected to Udara measure particulate matter (PM2.5), VOCs, temperature, and humidity. Look for monitors that:
- Use laser scattering technology for PM2.5.
- Provide real-time data connectivity.
- Have been validated or reviewed by independent third parties.

## Professional Testing

For specific concerns like mold, radon, or asbestos, professional testing is recommended. Professionals use specialized equipment and lab analysis to identify contaminants that consumer devices cannot detect.

## DIY Observation

Simple signs can indicate poor air quality:
- Condensation on windows (high humidity).
- Lingering odors.
- Visible dust buildup on surfaces quickly after cleaning.
- Health symptoms like headaches or irritation that improve when you leave the building.

## Interpreting Data

Don't panic over short-term spikes (like from cooking). Look for long-term trends and persistent high levels to identify sources you can control.
    `,
  },
  6: {
    title: "Seasonal Air Quality Changes",
    subtitle: "How air quality varies throughout the year and what to expect",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800&fit=crop",
    content: "\nAir quality is not static; it fluctuates with the seasons due to changes in weather patterns and human activities.\n\n## Winter\n\n**Inversions**: Cold air near the ground can get trapped by a layer of warm air above, holding pollutants close to the surface.\n**Heating**: Wood burning and increased energy use for heating contribute to higher particulate matter levels.\n\n## Spring\n\n**Allergens**: Tree and grass pollens are at their peak, affecting those with allergies and asthma.\n**Wind**: Windy conditions can transport dust and pollutants over long distances.\n\n## Summer\n\n**Ozone**: Sunlight and heat react with emissions from vehicles and industry to form ground-level ozone, a powerful respiratory irritant.\n**Wildfires**: Heat and drought increase the risk of wildfires, which can degrade air quality across entire continents.\n\n## Autumn\n\n**Stagnation**: Calm weather can lead to pollutant buildup.\n**Leaf Burning**: In some areas, burning yard waste releases smoke and particles.\n\n## Preparation\n\nKnowing these patterns helps you prepare—like ensuring you have allergy medication in spring or checking ozone forecasts in summer.\n    ",
  },
  7: {
    title: "Air Quality and Exercise",
    subtitle: "Best practices for outdoor activities during different air quality conditions",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&fit=crop",
    content: "\nExercise is vital for health, but exercising in polluted air can be counterproductive. During physical activity, you breathe deeper and faster, inhaling more pollutants directly into your lungs.\n\n## When to Exercise Outdoors\n\n- **AQI 0-50 (Good)**: Ideal conditions for all outdoor activities.\n- **AQI 51-100 (Moderate)**: Generally safe, but unusually sensitive people should consider reducing prolonged heavy exertion.\n\n## When to Be Cautious\n\n- **AQI 101-150 (Unhealthy for Sensitive Groups)**: Adults with lung disease, older adults, and children should reduce prolonged heavy exertion. Healthy adults can likely continue but should monitor for symptoms.\n- **Traffic**: Avoid running or cycling near busy roads where pollution concentrations are highest.\n\n## When to Move Indoors\n\n- **AQI 151+ (Unhealthy)**: Everyone should avoid prolonged or heavy exertion outdoors. Move your workout to a gym, home, or indoor track.\n\n## Tips for Safer Workouts\n\n- **Time of Day**: Ozone is usually lower in the morning.\n- **Location**: Exercise in parks or green spaces away from highways.\n- **Listen to Your Body**: If you feel chest tightness, coughing, or difficulty breathing, stop immediately.\n    ",
  },
}

export default function ArticleScreen() {
  const { id } = useLocalSearchParams()
  const article = articleContent[id as keyof typeof articleContent]
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    checkBookmarkStatus()
  }, [id])

  const checkBookmarkStatus = async () => {
    try {
      const bookmarks = await AsyncStorage.getItem('bookmarked_articles')
      if (bookmarks) {
        const parsed = JSON.parse(bookmarks)
        setIsBookmarked(parsed.includes(id))
      }
    } catch (e) {
      console.error("Failed to load bookmarks", e)
    }
  }

  const toggleBookmark = async () => {
    try {
      const bookmarks = await AsyncStorage.getItem('bookmarked_articles')
      let parsed = bookmarks ? JSON.parse(bookmarks) : []
      
      if (isBookmarked) {
        parsed = parsed.filter((articleId: string) => articleId !== id)
      } else {
        if (!parsed.includes(id)) parsed.push(id)
      }
      
      await AsyncStorage.setItem('bookmarked_articles', JSON.stringify(parsed))
      setIsBookmarked(!isBookmarked)
    } catch (e) {
      console.error("Failed to toggle bookmark", e)
    }
  }

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
        <TouchableOpacity style={styles.headerButton} onPress={toggleBookmark}>
          <Ionicons 
            name={isBookmarked ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isBookmarked ? "#4361EE" : "#333"} 
          />
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
      <Stack.Screen options={{ headerShown: false }} />
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