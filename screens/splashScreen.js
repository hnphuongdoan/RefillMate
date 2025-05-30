import React, { useEffect, useState, useCallback } from 'react';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// Prevent the splash screen from auto-hiding immediately
ExpoSplashScreen.preventAutoHideAsync();

export default function SplashScreen({ children }) {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2 second loading
    

      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the app to render and hide the splash screen
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await ExpoSplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {

    return (
      <View style={styles.container} onLayout={onLayoutRootView}>
        {/* You can put a custom loading indicator or logo here */}
        <Text style={styles.loadingText}>Loading RefillMateApp...</Text>
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
      </View>
    );
  }


  return <View style={{ flex: 1 }} onLayout={onLayoutRootView}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff', 
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});