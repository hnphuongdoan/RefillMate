// App.js (Updated to include BadgesScreen)
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import MainMap from './screens/MapScreen';
import AddStationDetailScreen from './screens/AddStationDetail';
import StationDetailScreen from './screens/StationDetailScreen';
import ReviewScreen from './screens/ReviewScreen';
import SettingScreen from './screens/SettingScreen';
import BadgesScreen from './screens/BadgesScreen'; 

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (initializing) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('./assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Find fresh, free water – wherever you go.</Text>
        <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainMap" component={MainMap} />
        <Stack.Screen name="AddStationDetail" component={AddStationDetailScreen} />
        <Stack.Screen name="StationDetail" component={StationDetailScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="Settings" component={SettingScreen} />
        <Stack.Screen name="Badges" component={BadgesScreen} /> {/* <--- Add BadgesScreen */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#87CEFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  tagline: {
    fontSize: 18,
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});