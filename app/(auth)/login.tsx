"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Link, router } from "expo-router"
import { useEffect, useState } from "react"
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  Alert,
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
import { useAuth } from "../../hooks/useAuth"

const REMEMBER_ME_KEY = "@remember_me"
const SAVED_EMAIL_KEY = "@saved_email"

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const { signIn, signInWithGoogle } = useAuth()

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  const nativeGoogleSignIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (idToken) {
        handleGoogleSignIn(idToken);
      } else {
        Alert.alert("Error", "No ID token found");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Google Sign In Error:", error);
      if (error.code) {
        // Handle specific error codes if needed
        console.log("Error code:", error.code);
      }
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      const result = await signInWithGoogle(idToken);
      if (result.success) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("Google Sign In Failed", result.error);
      }
    } catch (error) {
      console.error("Google Sign In Error:", error);
      Alert.alert("Error", "An unexpected error occurred during Google Sign In");
    } finally {
      setLoading(false);
    }
  };

  // Load saved email on component mount
  useEffect(() => {
    loadSavedCredentials()
  }, [])

  const loadSavedCredentials = async () => {
    try {
      const savedRememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY)
      const savedEmail = await AsyncStorage.getItem(SAVED_EMAIL_KEY)

      if (savedRememberMe === "true" && savedEmail) {
        setRememberMe(true)
        setEmail(savedEmail)
      }
    } catch (error) {
      console.log("Error loading saved credentials:", error)
    }
  }

  const saveCredentials = async () => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, "true")
        await AsyncStorage.setItem(SAVED_EMAIL_KEY, email)
      } else {
        await AsyncStorage.removeItem(REMEMBER_ME_KEY)
        await AsyncStorage.removeItem(SAVED_EMAIL_KEY)
      }
    } catch (error) {
      console.log("Error saving credentials:", error)
    }
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)

    try {
      const result = await signIn(email, password)

      if (result.success) {
        // Save credentials if remember me is checked
        await saveCredentials()
        router.replace("/(tabs)")
      } else {
        Alert.alert("Sign In Failed", result.error)
      }
    } catch (error) {
      console.error("Sign in error:", error)
      Alert.alert("Error", "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
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

          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity style={styles.tabButton}>
              <Text style={styles.tabText}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
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

          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.rememberMeContainer} onPress={toggleRememberMe}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <TouchableOpacity
            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.signInButtonText}>{loading ? "Signing In..." : "Sign In"}</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>Or continue with</Text>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={nativeGoogleSignIn}
            >
              <Ionicons name="logo-google" size={24} color="#000" />
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
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  logoImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 12
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
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: "#4361EE",
    borderColor: "#4361EE",
  },
  rememberMeText: {
    fontSize: 14,
    color: "#666",
  },
  forgotPassword: {
    // No additional styles needed
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
  signInButtonDisabled: {
    backgroundColor: "#A0A0A0",
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
