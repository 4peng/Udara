"use client"

import { Ionicons } from "@expo/vector-icons"
import { Link, router } from "expo-router"
import { useEffect, useState } from "react"
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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

export default function SignUpScreen() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { signUp, signInWithGoogle } = useAuth()

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

  const handleSignUp = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters")
      return
    }

    setLoading(true)
    const result = await signUp(email, password)
    setLoading(false)

    if (result.success) {
      router.replace("/(tabs)")
    } else {
      Alert.alert("Sign Up Failed", result.error)
    }
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
            <Ionicons name="leaf-outline" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>Udara</Text>
        </View>

        <View style={styles.tabContainer}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.tabButton}>
              <Text style={styles.tabText}>Sign In</Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity style={[styles.tabButton, styles.activeTabButton]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Sign Up</Text>
            <View style={styles.activeTabIndicator} />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#A0A0A0"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
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
              placeholder="Create a password"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={togglePasswordVisibility}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#A0A0A0" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.signUpButtonText}>{loading ? "Creating Account..." : "Sign Up"}</Text>
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
    marginBottom: 20,
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
  signUpButton: {
    backgroundColor: "#4361EE",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  signUpButtonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  signUpButtonText: {
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
