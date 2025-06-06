// screens/PrivacyPolicyScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  // Function to handle the Back button 
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainMap');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Privacy Policy</Text>

        <Text style={styles.paragraph}>
          This Privacy Policy describes how the RefillMate application ("we," "our," or "us") collects, uses, and shares your information when you use our services.
        </Text>

        <Text style={styles.subTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information to provide and improve our services to you.
          {"\n\n"}
          <Text style={styles.boldText}>Information you provide directly:</Text>
          {"\n"}- <Text style={styles.boldText}>Account information:</Text> When you register or log in, we collect your email address and password (securely stored by Firebase Authentication).
          {"\n"}- <Text style={styles.boldText}>Water station data:</Text> When you add a new water station, we collect the station name, address, description, water type, accessibility, and images (if provided).
          {"\n"}- <Text style={styles.boldText}>Reviews:</Text> When you submit a review, we collect your star rating, comment, and user ID.
          {"\n\n"}
          <Text style={styles.boldText}>Automatically collected information:</Text>
          {"\n"}- <Text style={styles.boldText}>Location data:</Text> We collect your location data (only when you grant permission) to display nearby water stations and allow you to add new stations based on your current location. This data may be collected even when the app is in the background if you allow it.
          {"\n"}- <Text style={styles.boldText}>Usage data:</Text> We may collect information about how you interact with the app, including the pages you visit, the features you use, and the time you spend in the app.
        </Text>

        <Text style={styles.subTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information collected for the following purposes:
          {"\n"}- To provide, operate, and maintain the RefillMate application.
          {"\n"}- To personalize your experience and provide relevant features.
          {"\n"}- To understand and analyze how you use the app to improve our services.
          {"\n"}- To develop new products, services, features, and functionality.
          {"\n"}- To communicate with you (if you enable notifications).
        </Text>

        <Text style={styles.subTitle}>3. Sharing Your Information</Text>
        <Text style={styles.paragraph}>
          We do not sell or share your personally identifiable information with third parties, except in the following cases:
          {"\n"}- With third-party service providers who assist us in operating the app (e.g., Firebase for database and authentication).
          {"\n"}- To comply with laws or legal requirements.
          {"\n"}- To protect the rights, property, or safety of RefillMate, our users, or others.
        </Text>

        <Text style={styles.subTitle}>4. Data Storage</Text>
        <Text style={styles.paragraph}>
          We store your data on Firebase Firestore and Firebase Storage. This data is secured according to Firebase's security rules.
        </Text>

        <Text style={styles.subTitle}>5. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our services are not intended for children under the age of 13. We do not knowingly collect personally identifiable information from children under 13.
        </Text>

        <Text style={styles.subTitle}>6. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
        </Text>

        <Text style={styles.subTitle}>7. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us at: feedback@refillmate.com
        </Text>
      </ScrollView>

      {/* New Back button at the bottom right */}
      <TouchableOpacity style={styles.bottomRightBackButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={styles.bottomRightBackButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f7fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  
  title: {
    fontSize: 28,
    color: '#0077b6',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0077b6',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  // NEW: Styles for the bottom-right back button 
  bottomRightBackButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0077b6', // Blue color
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30, // Make the button rounder
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bottomRightBackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
