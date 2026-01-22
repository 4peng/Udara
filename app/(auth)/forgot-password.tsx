"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import { ROUTES } from "../../constants/Routes"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useAuth } from "../../hooks/useAuth"

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const { resetPassword } = useAuth()

  const handleSendResetLink = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address")
      return
    }

    setLoading(true)
    const result = await resetPassword(email)
    setLoading(false)

    if (result.success) {
      setEmailSent(true)
      Alert.alert("Success", "Password reset email sent! Check your inbox.")
    } else {
      Alert.alert("Error", result.error)
    }
  }

  const handleResend = async () => {
    await handleSendResetLink()
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <View style={styles.emptySpace} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={32} color="#4361EE" />
          </View>

          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.description}>
            Enter your email address and we'll send you instructions to reset your password
          </Text>

          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#A0A0A0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleSendResetLink}
            disabled={loading}
          >
            <Text style={styles.resetButtonText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
          </TouchableOpacity>

          {emailSent && (
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive the email?{" "}
                <Text style={styles.resendLink} onPress={handleResend}>
                  Resend
                </Text>
              </Text>
            </View>
          )}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Remember your password?{" "}
              <Text style={styles.loginLink} onPress={() => router.push(ROUTES.AUTH.LOGIN)}>
                Login
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySpace: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E6EFFF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#333333",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 24,
    fontSize: 16,
    color: "#333333",
  },
  resetButton: {
    backgroundColor: "#4361EE",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  resetButtonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: "#666666",
  },
  resendLink: {
    color: "#4361EE",
    fontWeight: "600",
  },
  loginContainer: {
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 30,
  },
  loginText: {
    fontSize: 14,
    color: "#666666",
  },
  loginLink: {
    color: "#4361EE",
    fontWeight: "600",
  },
})
