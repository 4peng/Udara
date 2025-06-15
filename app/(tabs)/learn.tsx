"use client"

import { router } from "expo-router"
import { useEffect } from "react"

export default function LearnTab() {
  useEffect(() => {
    router.replace("/learn")
  }, [])

  return null
}
