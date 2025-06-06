// screens/SettingScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingScreen() {
  const navigation = useNavigation();

  // State for settings
  const [measurementUnit, setMeasurementUnit] = useState('km'); // 'km' or 'mi'
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // true or false

  // Load settings when the component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const unit = await AsyncStorage.getItem('measurementUnit');
        if (unit !== null) {
          setMeasurementUnit(unit);
        }
        const notifications = await AsyncStorage.getItem('notificationsEnabled');
        if (notifications !== null) {
          setNotificationsEnabled(JSON.parse(notifications)); // AsyncStorage stores as string
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        Alert.alert('Error', 'Failed to load your settings.');
      }
    };
    loadSettings();
  }, []);

  // Save settings when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('measurementUnit', measurementUnit);
        await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
      } catch (error) {
        console.error('Failed to save settings:', error);
        Alert.alert('Error', 'Failed to save your settings.');
      }
    };
    saveSettings();
  }, [measurementUnit, notificationsEnabled]);

  const toggleNotifications = () => {
    setNotificationsEnabled(previousState => !previousState);
    Alert.alert('Notifications', `Notifications are now ${!notificationsEnabled ? 'enabled' : 'disabled'}.`);
  };

  const handleChangeUnit = (unit) => {
    setMeasurementUnit(unit);
    Alert.alert('Unit Changed', `Measurement unit set to ${unit.toUpperCase()}.`);
  };

  const handleHelpPress = () => {
    Alert.alert(
      'Feature Unavailable',
      'Help & FAQ functionality is not yet available. It will be updated when the app is more complete.'
    );
  };

  const handleFeedbackPress = () => {
    Alert.alert(
      'Feature Unavailable',
      'Send Feedback functionality is not yet available. It will be updated when the app is more complete.'
    );
  };

  const handlePrivacyPolicyPress = () => {
    navigation.navigate('PrivacyPolicy');
  };

  // Back button handler function
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
        <Text style={styles.title}>Settings</Text>

        {/* Measurement Units */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurement Units</Text>
          <View style={styles.unitToggleContainer}>
            <TouchableOpacity
              style={[
                styles.unitOption,
                measurementUnit === 'km' && styles.unitOptionSelected
              ]}
              onPress={() => handleChangeUnit('km')}
            >
              <Text style={[
                styles.unitOptionText,
                measurementUnit === 'km' && styles.unitOptionTextSelected
              ]}>KM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitOption,
                measurementUnit === 'mi' && styles.unitOptionSelected
              ]}
              onPress={() => handleChangeUnit('mi')}
            >
              <Text style={[
                styles.unitOptionText,
                measurementUnit === 'mi' && styles.unitOptionTextSelected
              ]}>Miles</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.notificationToggle}>
            <Text style={styles.optionText}>Enable App Notifications</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#0077b6' }}
              thumbColor={notificationsEnabled ? '#f4f3f4' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleNotifications}
              value={notificationsEnabled}
            />
          </View>
        </View>

        {/* Support & Legal section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <TouchableOpacity style={styles.optionButton} onPress={handleHelpPress}>
            <Text style={styles.optionText}>Help & FAQ</Text>
            <Ionicons name="chevron-forward" size={20} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={handleFeedbackPress}>
            <Text style={styles.optionText}>Send Feedback</Text>
            <Ionicons name="chevron-forward" size={20} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={handlePrivacyPolicyPress}>
            <Text style={styles.optionText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#555" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Back button on the right bottombottom */}
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0077b6',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    height: 40,
  },
  unitOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  unitOptionSelected: {
    backgroundColor: '#0077b6',
  },
  unitOptionText: {
    fontSize: 16,
    color: '#555',
    fontWeight: 'bold',
  },
  unitOptionTextSelected: {
    color: '#fff',
  },
  segmentedControl: {
    height: 40,
  },
  notificationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  // NEW: Styles for the bottom-right back button 
  bottomRightBackButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0077b6', 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30, 
    elevation: 5, // Android
    shadowColor: '#000', // iOS
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
