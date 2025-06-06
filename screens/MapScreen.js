// screens/MapScreen.js
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
        const data = doc.data();
        // STRICTLY filter out any station that doesn't have a name, id, latitude, or longitude
        if (data && doc.id && typeof data.name === 'string' && data.name.trim() !== '' &&
            typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          stations.push({ id: doc.id, ...data });
        } else {
          console.warn("Skipping incomplete or invalid station data:", doc.id, data);
        }
      });
      setWaterStations(stations);
      setFilteredStations(stations);
      console.log("Fetched valid water stations:", stations);
    }, (error) => {
      console.error("Error fetching water stations:", error);
      Alert.alert("Error", "Failed to load water stations: " + error.message);
    });

    return () => unsubscribe();
  }, [db]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      setFilteredStations(waterStations);
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

  // Improved Function to handle marker press with strict validation
  const handleMarkerPress = (station) => {
    if (station && station.id && typeof station.name === 'string' && station.name.trim() !== '' &&
        typeof station.latitude === 'number' && typeof station.longitude === 'number') {
      navigation.navigate('StationDetail', { station: station });
    } else {
      Alert.alert('Invalid Station Data', 'Details for this station are incomplete or malformed. Cannot open details screen.');
      console.warn('Attempted to open StationDetail with incomplete/invalid data:', station);
    }
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

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

      <View style={styles.bottomRightButtonsContainer}>
        <TouchableOpacity style={styles.badgesButton} onPress={handleBadgesPress}>
          <Ionicons name="trophy" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
          <Ionicons name="settings" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.addStationButton} onPress={handleAddStationPress}>
          <Text style={styles.addStationButtonText}>+</Text>
        </TouchableOpacity>
      </View>

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
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomRightButtonsContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 11,
  },
  addStationButton: {
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
    marginBottom: 10,
  },
  addStationButtonText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 30,
  },
  settingsButton: {
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
    marginBottom: 10,
  },
  badgesButton: {
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
    marginBottom: 10,
  },
});
