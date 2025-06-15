"use client"

import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import {
    Image,
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

const LoginScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSignIn = () => {
    // Implement sign in logic here
    console.log("Sign in with:", email, password)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>Udara</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "signin" && styles.activeTabButton]}
            onPress={() => setActiveTab("signin")}
          >
            <Text style={[styles.tabText, activeTab === "signin" && styles.activeTabText]}>Sign In</Text>
            {activeTab === "signin" && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "signup" && styles.activeTabButton]}
            onPress={() => navigation.navigate("SignUp")}
          >
            <Text style={[styles.tabText, activeTab === "signup" && styles.activeTabText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Email or username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email or username"
            placeholderTextColor="#A0A0A0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={togglePasswordVisibility}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#A0A0A0" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>Or continue with</Text>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            By continuing, you agree to our <Text style={styles.linkText}>Terms of Service</Text> and{" "}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
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
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 30,
  },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: "#4361EE",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 30,
    height: 30,
    tintColor: "#FFFFFF",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    position: "relative",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#4361EE",
  },
  tabText: {
    fontSize: 16,
    color: "#A0A0A0",
  },
  activeTabText: {
    color: "#4361EE",
    fontWeight: "600",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -1,
    height: 2,
    width: "100%",
    backgroundColor: "#4361EE",
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
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
    marginBottom: 16,
    fontSize: 16,
    color: "#333333",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    height: 50,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333333",
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#4361EE",
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: "#4361EE",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  orText: {
    textAlign: "center",
    color: "#A0A0A0",
    marginVertical: 20,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  termsText: {
    textAlign: "center",
    fontSize: 12,
    color: "#A0A0A0",
    marginBottom: 20,
  },
  linkText: {
    color: "#4361EE",
  },
})

export default LoginScreen
