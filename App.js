// RefillMateApp/App.js

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  // Removed Google Sign-in related functions
} from 'firebase/auth';
import { auth } from './config/firebaseConfig'; 
import * as SplashScreen from 'expo-splash-screen';

// Prevent the native splash screen from auto-hiding until the app is ready.
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);

  // Removed all state and useEffect hooks related to Google Sign-in (request, response, promptAsync)

  // useEffect hook to prepare the app and manage the splash screen.
  useEffect(() => {
    async function prepareApp() {
      try {
      } catch (e) {
        console.warn("App preparation error:", e);
      } finally {
        // Mark the app as ready to render its main content.
        setAppIsReady(true);
      }
    }
    prepareApp();
  }, []); // Empty dependency array means this effect runs once on mount.

  // useEffect hook to hide the splash screen once the app is ready.
  // This runs whenever `appIsReady` changes.
  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync(); // Hide the native splash screen.
    }
  }, [appIsReady]); // Dependency array: re-run effect when `appIsReady` changes.

  // Function to handle Email/Password Login.
  const handleEmailLogin = async () => {
    setLoading(true); // Show loading indicator.
    try {
      await signInWithEmailAndPassword(auth, email, password); // Attempt to sign in.
      Alert.alert("Success", "Logged in!");
      // User remains on this screen after successful login.
      // In a full app, you would navigate to the main screen here.
    } catch (error) {
      Alert.alert("Login Failed", error.message); // Show error message.
      console.error("Login error:", error);
    } finally {
      setLoading(false); // Hide loading indicator.
    }
  };

  // Function to handle Email/Password Sign Up.
  const handleEmailSignUp = async () => {
    setLoading(true); // Show loading indicator.
    try {
      await createUserWithEmailAndPassword(auth, email, password); // Attempt to create user.
      Alert.alert("Success", "Account created!");
      // User remains on this screen after successful signup.
    } catch (error) {
      Alert.alert("Sign Up Failed", error.message); // Show error message.
      console.error("Sign up error:", error);
    } finally {
      setLoading(false); // Hide loading indicator.
    }
  };

  // Function to handle Password Reset.
  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email to reset password.");
      return; // Exit if email is empty.
    }
    setLoading(true); // Show loading indicator.
    try {
      await sendPasswordResetEmail(auth, email); // Send password reset email.
      Alert.alert("Success", "Password reset email sent to your email address!");
    } catch (error) {
      Alert.alert("Password Reset Failed", error.message); // Show error message.
      console.error("Password reset error:", error);
    } finally {
      setLoading(false); // Hide loading indicator.
    }
  };

  // Render nothing until the app is ready and the splash screen is hidden.
  if (!appIsReady) {
    return null;
  }

  // Main component rendering the login/signup form.
  return (
    <KeyboardAvoidingView
      style={styles.container}
      // Use 'padding' for iOS and 'height' for Android to handle keyboard adjustments
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>RefillMateApp Login / Sign Up</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#666"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#666"
      />
      <View style={styles.buttonRow}>
        <Button title="Login" onPress={handleEmailLogin} disabled={loading} />
        <View style={{ width: 10 }} /> {/* Spacer between buttons */}
        <Button title="Sign Up" onPress={handleEmailSignUp} disabled={loading} />
      </View>
      {/* Removed TouchableOpacity for Google button */}
      {/* Removed ActivityIndicator specific to Google */}

      <TouchableOpacity onPress={handlePasswordReset} disabled={loading}>
        <Text style={styles.resetPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Show a general ActivityIndicator when loading */}
      {loading && (
        <ActivityIndicator size="small" color="#0000ff" style={{ marginTop: 20 }} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8', // Light background color
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32, // Larger font size
    marginBottom: 40,
    fontWeight: 'bold',
    color: '#333', // Darker text color
  },
  input: {
    width: '100%',
    height: 55, // Taller input fields
    borderColor: '#ddd', // Softer border color
    borderWidth: 1,
    borderRadius: 10, // More rounded corners
    marginBottom: 18,
    paddingHorizontal: 18,
    fontSize: 16,
    backgroundColor: '#fff', // White background for inputs
    shadowColor: '#000', // Subtle shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // Android shadow (will be ignored on iOS but good practice)
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
    width: '100%',
    justifyContent: 'space-around',
  },
  resetPasswordText: {
    marginTop: 25,
    color: '#007bff',
    fontSize: 15,
    textDecorationLine: 'underline', // Underlined text
  },
});