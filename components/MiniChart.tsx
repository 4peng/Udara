"use client"

import { StyleSheet, View } from "react-native"
import { LineChart } from "react-native-chart-kit"

interface MiniChartProps {
  data: number[]
  color: string
  width?: number
  height?: number
}

export default function MiniChart({ data, color, width = 100, height = 30 }: MiniChartProps) {
  const chartData = {
    labels: [],
    datasets: [
      {
        data: data,
        color: (opacity = 1) => color,
        strokeWidth: 2,
      },
    ],
  }

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={width}
        height={height}
        chartConfig={{
          backgroundColor: "transparent",
          backgroundGradientFrom: "transparent",
          backgroundGradientTo: "transparent",
          decimalPlaces: 0,
          color: (opacity = 1) => color,
          style: {
            borderRadius: 0,
          },
          propsForDots: {
            r: "0",
          },
          propsForBackgroundLines: {
            stroke: "transparent",
          },
        }}
        bezier
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={false}
        withDots={false}
        withShadow={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
})
