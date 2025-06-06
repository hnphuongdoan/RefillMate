// MapScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Dimensions,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { auth, db } from '../config/firebaseConfig';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const MELBOURNE_CBD_LATITUDE = -37.814;
const MELBOURNE_CBD_LONGITUDE = 144.963;

export default function MainMapScreen() {
  const [location, setLocation] = useState(null);
  const [search, setSearch] = useState('');
  const [waterStations, setWaterStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigation = useNavigation();

  const mapRef = useRef(null);

  // Effect to get user's current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        Alert.alert('Location Permission Denied', 'Please enable location services for this app to show your location on the map.');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();
  }, []);

  // Effect to fetch water stations from Firestore
  useEffect(() => {
    if (!db) {
      console.error("Firestore 'db' instance is not available.");
      Alert.alert("Configuration Error", "Firestore database is not initialized. Please check firebaseConfig.js.");
      return;
    }

    const q = query(collection(db, 'waterStations'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const stations = [];
      querySnapshot.forEach((doc) => {
        stations.push({ id: doc.id, ...doc.data() });
      });
      setWaterStations(stations);
      setFilteredStations(stations); // Initially, display all stations
      console.log("Fetched water stations:", stations);
    }, (error) => {
      console.error("Error fetching water stations:", error);
      Alert.alert("Error", "Failed to load water stations: " + error.message);
    });

    return () => unsubscribe();
  }, [db]);

  // Haversine formula to calculate distance between two lat/lon points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      setFilteredStations(waterStations); // If search is empty, show all stations
      if (mapRef.current && location) {
        mapRef.current.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      } else if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: MELBOURNE_CBD_LATITUDE,
          longitude: MELBOURNE_CBD_LONGITUDE,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
      return;
    }

    setSearchLoading(true);
    try {
      const geoResults = await Location.geocodeAsync(search.trim());

      if (geoResults.length > 0) {
        const { latitude: searchLat, longitude: searchLon } = geoResults[0];

        const stationsWithDistance = waterStations.map(station => ({
          ...station,
          distance: calculateDistance(searchLat, searchLon, station.latitude, station.longitude),
        }));

        const nearestStations = stationsWithDistance
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 2);

        setFilteredStations(nearestStations);

        if (mapRef.current && nearestStations.length > 0) {
          const coordsToFit = nearestStations.map(s => ({ latitude: s.latitude, longitude: s.longitude }));
          mapRef.current.fitToCoordinates(coordsToFit, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        } else if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: searchLat,
            longitude: searchLon,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }

      } else {
        Alert.alert('Search Error', 'Could not find location for the entered address. Showing all stations.');
        setFilteredStations(waterStations);
      }
    } catch (error) {
      console.error('Error during search:', error);
      Alert.alert('Search Error', 'Failed to perform search: ' + error.message);
      setFilteredStations(waterStations);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error("Logout Error:", error.message);
      Alert.alert("Logout Error", error.message);
    }
  };

  const handleAddStationPress = () => {
    navigation.navigate('AddStationDetail', { initialCoords: location });
  };

  const handleMarkerPress = (station) => {
    navigation.navigate('StationDetail', { station: station });
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  // NEW: Function to navigate to BadgesScreen
  const handleBadgesPress = () => {
    navigation.navigate('Badges');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.tagline}>Find the closest tap water station near you!!!</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search location..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={searchLoading}
        >
          {searchLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: MELBOURNE_CBD_LATITUDE,
          longitude: MELBOURNE_CBD_LONGITUDE,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {filteredStations.map((station) => (
          <Marker
            key={station.id}
            coordinate={{ latitude: station.latitude, longitude: station.longitude }}
            title={station.name}
            description={station.address || station.description}
            onPress={() => handleMarkerPress(station)}
          />
        ))}

        {location && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title="Your Location"
            pinColor="blue"
          />
        )}
      </MapView>

      {/* Add Station Button */}
      <TouchableOpacity style={styles.addStationButton} onPress={handleAddStationPress}>
        <Text style={styles.addStationButtonText}>+</Text>
      </TouchableOpacity>

      {/* Settings Button */}
      <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
        <Ionicons name="settings" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Badges Button - NEW */}
      <TouchableOpacity style={styles.badgesButton} onPress={handleBadgesPress}>
        <Ionicons name="trophy" size={24} color="#fff" /> {/* Trophy icon for badges */}
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tagline: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: '#e0f7fa',
  },
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  searchBar: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#0077b6',
    paddingHorizontal: 15,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -1,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addStationButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 11,
  },
  addStationButtonText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 30,
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 40,
    right: 20,
    backgroundColor: '#0077b6',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 11,
  },
  badgesButton: { // NEW style for the badges button
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 40,
    right: 75, // Position it to the left of the settings button
    backgroundColor: '#0077b6',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 11,
  },
});
