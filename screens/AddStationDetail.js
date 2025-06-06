// screens/AddStationDetail.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { db, app, auth } from '../config/firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export default function AddStationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { initialCoords } = route.params || {};

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [waterType, setWaterType] = useState('');
  const [accessibility, setAccessibility] = useState('');
  const [latitude, setLatitude] = useState(initialCoords?.latitude || '');
  const [longitude, setLongitude] = useState(initialCoords?.longitude || '');
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingStation, setSubmittingStation] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [locationFetching, setLocationFetching] = useState(false); // NEW: State for fetching current location

  const storage = getStorage(app);

  // Effect to automatically populate location if initialCoords are provided (from MapScreen)
  useEffect(() => {
    if (initialCoords && !latitude && !longitude) { // Only set if not already set by address geocoding
      setLatitude(initialCoords.latitude);
      setLongitude(initialCoords.longitude);
      handleReverseGeocode({ // Automatically reverse geocode initial coords
        coords: {
          latitude: initialCoords.latitude,
          longitude: initialCoords.longitude,
        }
      });
    }
  }, [initialCoords]);

  // Effect to perform geocoding when address changes (convert address to lat/lon)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Prevent geocoding if location is currently being fetched or address is too short
      if (locationFetching || address.trim().length < 5) {
        if (address.trim() === '') { // Clear lat/lon when address is cleared
          setLatitude('');
          setLongitude('');
        }
        return;
      }

      // Simple heuristic: if address looks like coordinates, skip geocoding
      if (!isNaN(parseFloat(address.split(',')[0])) && !isNaN(parseFloat(address.split(',')[1]))) {
          // It might be coordinates, let the user manually override
          return;
      }

      setGeocodingLoading(true);
      try {
        const geocodedLocation = await Location.geocodeAsync(address.trim());
        if (geocodedLocation.length > 0) {
          setLatitude(geocodedLocation[0].latitude);
          setLongitude(geocodedLocation[0].longitude);
          console.log("Geocoded:", geocodedLocation[0]);
        } else {
          console.log("No coordinates found for address:", address);
          // Optionally clear lat/lon or keep last known if geocoding fails
        }
      } catch (error) {
        console.error("Error geocoding address:", error);
        Alert.alert("Geocoding Error", "Could not find coordinates for this address. Please check the address or enter coordinates manually.");
      } finally {
        setGeocodingLoading(false);
      }
    }, 1000); // Debounce for 1 second to avoid too many API calls

    return () => clearTimeout(delayDebounceFn); // Clear timeout if address changes again quickly
  }, [address, locationFetching]);


  // NEW FUNCTION: Handle reverse geocoding from given coordinates
  const handleReverseGeocode = async (locationResult) => {
    if (!locationResult || !locationResult.coords) {
      return;
    }
    setLatitude(locationResult.coords.latitude);
    setLongitude(locationResult.coords.longitude);

    setGeocodingLoading(true);
    try {
      let geocode = await Location.reverseGeocodeAsync({
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      });
      if (geocode.length > 0) {
        const place = geocode[0];
        const fullAddress = [
          place.name,
          place.street,
          place.city,
          place.region,
          place.postalCode,
          place.country,
        ].filter(Boolean).join(', ');
        setAddress(fullAddress);
        // Suggest a name for the station based on address if name is empty
        if (!name.trim()) {
            setName(place.name || place.street || 'New Water Station');
        }
      } else {
        Alert.alert('Address Not Found', 'Could not find an address for your current location.');
        if (!name.trim()) {
            setName('New Water Station'); // Default name if address not found
        }
      }
    } catch (error) {
      console.error("Error reverse geocoding current location:", error);
      Alert.alert('Location Error', 'Failed to get address from location: ' + error.message);
    } finally {
      setGeocodingLoading(false);
    }
  };

  // NEW FUNCTION: Get current location and auto-fill
  const handleUseCurrentLocation = async () => {
    setLocationFetching(true);
    setGeocodingLoading(true); // Also set geocoding loading while fetching location

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please enable location services to use your current location.');
      setLocationFetching(false);
      setGeocodingLoading(false);
      return;
    }

    try {
      let currentLocation = await Location.getCurrentPositionAsync({});
      await handleReverseGeocode(currentLocation); // Use the new reverse geocode handler
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert('Location Error', 'Failed to get your current location: ' + error.message);
    } finally {
      setLocationFetching(false);
      setGeocodingLoading(false);
    }
  };


  // Function to pick an image from device library
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please enable media library permissions to pick an image.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  // Function to upload image to Firebase Storage
  const uploadImageAsync = async (uri) => {
    if (!uri) return null;

    setUploadingImage(true);
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.log(e);
        reject(new TypeError('Network request failed'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

    const fileRef = ref(storage, `station_images/${uuidv4()}`);
    const result = await uploadBytes(fileRef, blob);

    blob.close();
    setUploadingImage(false);
    return await getDownloadURL(fileRef);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !address.trim() || !waterType.trim() || !accessibility.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields: Name, Address, Water Type, Accessibility.');
      return;
    }
    const finalLatitude = parseFloat(latitude);
    const finalLongitude = parseFloat(longitude);

    if (isNaN(finalLatitude) || isNaN(finalLongitude)) {
      Alert.alert('Invalid Location', 'Latitude and Longitude must be valid numbers. Please check the address or enter them manually.');
      return;
    }
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'You must be logged in to add a station.');
      return;
    }

    setSubmittingStation(true);
    let imageUrl = null;
    if (selectedImageUri) {
      imageUrl = await uploadImageAsync(selectedImageUri);
      if (!imageUrl) {
        Alert.alert('Image Upload Failed', 'Could not upload image. Please try again.');
        setSubmittingStation(false);
        return;
      }
    }

    try {
      const stationsCollectionRef = collection(db, 'waterStations');
      await addDoc(stationsCollectionRef, {
        name: name.trim(),
        address: address.trim(),
        description: description.trim(),
        waterType: waterType.trim(),
        accessibility: accessibility.trim(),
        latitude: finalLatitude,
        longitude: finalLongitude,
        imageUrl: imageUrl,
        addedBy: auth.currentUser.uid,
        createdAt: Timestamp.now(),
      });
      Alert.alert('Success', 'Water station added successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding document: ', error);
      Alert.alert('Error', 'Failed to add water station: ' + error.message);
    } finally {
      setSubmittingStation(false);
    }
  };

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
        <Text style={styles.title}>Add New Water Station</Text>

        <TextInput
          style={styles.input}
          placeholder="Station Name*"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Address*"
          placeholderTextColor="#aaa"
          value={address}
          onChangeText={setAddress}
          editable={!locationFetching} // Disable while fetching current location
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Water Type (e.g., Tap, Filtered, Spring)*"
          placeholderTextColor="#aaa"
          value={waterType}
          onChangeText={setWaterType}
        />
        <TextInput
          style={styles.input}
          placeholder="Accessibility (e.g., Public, Business, Park)*"
          placeholderTextColor="#aaa"
          value={accessibility}
          onChangeText={setAccessibility}
        />

        <View style={styles.locationContainer}>
          <TextInput
            style={[styles.input, styles.locationInput]}
            placeholder="Latitude*"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={String(latitude)}
            onChangeText={setLatitude}
            editable={!geocodingLoading && !locationFetching} // Disable manual edit while geocoding or fetching location
          />
          <TextInput
            style={[styles.input, styles.locationInput]}
            placeholder="Longitude*"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={String(longitude)}
            onChangeText={setLongitude}
            editable={!geocodingLoading && !locationFetching} // Disable manual edit while geocoding or fetching location
          />
          {(geocodingLoading || locationFetching) && ( // Show loading indicator
            <View style={styles.geocodingOverlay}>
              <ActivityIndicator size="small" color="#0077b6" />
            </View>
          )}
        </View>
        <Text style={styles.hintText}>*Auto-filled from address, current location, or enter manually</Text>

        {/* NEW: Use Current Location Button */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
          disabled={locationFetching || geocodingLoading}
        >
          {locationFetching ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
          ) : (
            <Ionicons name="navigate-circle-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
          )}
          <Text style={styles.currentLocationButtonText}>
            {locationFetching ? 'Getting Location...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>

        {/* Image Picker Section */}
        <View style={styles.imagePickerContainer}>
          {selectedImageUri ? (
            <Image source={{ uri: selectedImageUri }} style={styles.selectedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={50} color="#ccc" />
              <Text style={styles.imagePlaceholderText}>No image selected</Text>
            </View>
          )}
          <TouchableOpacity style={styles.pickImageButton} onPress={pickImage} disabled={uploadingImage}>
            <Text style={styles.pickImageButtonText}>
              {uploadingImage ? 'Uploading...' : 'Pick Image'}
            </Text>
            {uploadingImage && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submittingStation || geocodingLoading || locationFetching}>
          <Text style={styles.submitButtonText}>
            {submittingStation || geocodingLoading || locationFetching ? 'Processing...' : 'Add Station'}
          </Text>
          {(submittingStation || geocodingLoading || locationFetching) && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />}
        </TouchableOpacity>
      </ScrollView>

      {/* Back button at the bottom right */}
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
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    color: '#0077b6',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    position: 'relative',
  },
  locationInput: {
    flex: 1,
    marginRight: 10,
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: '#888',
    fontSize: 14,
  },
  pickImageButton: {
    backgroundColor: '#00b4d8',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickImageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
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
    elevation: 5,
    shadowColor: '#000',
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
  // NEW Styles for current location button
  currentLocationButton: {
    backgroundColor: '#17a2b8', 
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, 
  },
  currentLocationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  geocodingOverlay: { // Ensure this style covers both lat/lon inputs correctly
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    // Add margin for the loading overlay to position correctly over both input fields
    marginLeft: 0, // Adjusted from 10 to 0 because locationInput has marginRight
  }
});
