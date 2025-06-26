import { Stack, useLocalSearchParams } from 'expo-router'

export default function SensorLayout() {
  const { id } = useLocalSearchParams()
  
  return (
    <Stack>
      <Stack.Screen 
        name="[id]" 
        options={{
          title: `Sensor ${id}`,
          headerShown: false, // Since you have custom header
        }}
      />
    </Stack>
  )
}