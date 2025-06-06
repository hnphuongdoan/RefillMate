// screens/StationDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db, auth, app } from '../config/firebaseConfig';
import { doc, collection, onSnapshot, query, orderBy, Timestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export default function StationDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const initialStationDataFromParams = route.params?.station || null;

  const [station, setStation] = useState(initialStationDataFromParams);
  const [reviews, setReviews] = useState([]);
  const [fetchingReviews, setFetchingReviews] = useState(true);
  const [deletingStation, setDeletingStation] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState(initialStationDataFromParams?.imageUrl);
  const [uploadingImage, setUploadingImage] = useState(false);

  const storage = getStorage(app);

  useEffect(() => {
    if (!station || !station.id) {
        Alert.alert(
            'Error',
            'Station details could not be loaded. Please try again from the map.',
            [{ text: 'OK', onPress: () => navigation.replace('MainMap') }]
        );
        return;
    }

    const reviewsCollectionRef = collection(db, 'waterStations', station.id, 'reviews');
    const qReviews = query(reviewsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribeReviews = onSnapshot(qReviews, (querySnapshot) => {
      const fetchedReviews = [];
      let sumRatings = 0;
      querySnapshot.forEach((doc) => {
        const reviewData = { id: doc.id, ...doc.data() };
        fetchedReviews.push(reviewData);
        sumRatings += reviewData.rating || 0;
      });
      setReviews(fetchedReviews);
      setTotalReviews(fetchedReviews.length);
      setAverageRating(fetchedReviews.length > 0 ? sumRatings / fetchedReviews.length : 0);
      setFetchingReviews(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      Alert.alert("Error", "Failed to load reviews: " + error.message);
      setFetchingReviews(false);
    });

    const stationDocRef = doc(db, 'waterStations', station.id);
    const unsubscribeStation = onSnapshot(stationDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedStationData = docSnap.data();
        setStation(prevStation => ({ ...prevStation, ...updatedStationData }));
        setCurrentImageUrl(updatedStationData.imageUrl);
      } else {
        Alert.alert(
          'Station Not Found',
          'This station no longer exists. Returning to map.',
          [{ text: 'OK', onPress: () => navigation.replace('MainMap') }]
        );
      }
    }, (error) => {
      console.error("Error fetching station document:", error);
    });

    return () => {
      unsubscribeReviews();
      unsubscribeStation();
    };
  }, [station, navigation]);

  const handleDeleteStation = () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this water station? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Delete cancelled'),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingStation(true);
            try {
              if (!auth.currentUser) {
                Alert.alert('Permission Denied', 'You must be logged in to delete a station.');
                setDeletingStation(false);
                return;
              }
              if (!station || !station.id) {
                Alert.alert('Error', 'Invalid station to delete.');
                setDeletingStation(false);
                return;
              }

              const stationDocRef = doc(db, 'waterStations', station.id);
              await deleteDoc(stationDocRef);
              Alert.alert('Success', 'Water station deleted successfully!');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting station: ', error);
              Alert.alert('Error', 'Failed to delete station: ' + error.message);
            } finally {
              setDeletingStation(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleWriteReview = () => {
    navigation.navigate('Review', { stationId: station.id, stationName: station.name });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please enable media library permissions to pick an image.');
      return null;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  };

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

  const handleUpdateStationImage = async () => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'You must be logged in to update station information.');
      return;
    }
    if (!station || !station.id) {
      Alert.alert('Error', 'Invalid station to update image.');
      return;
    }

    const imageUri = await pickImage();
    if (imageUri) {
      const newImageUrl = await uploadImageAsync(imageUri);
      if (newImageUrl) {
        try {
          const stationDocRef = doc(db, 'waterStations', station.id);
          await updateDoc(stationDocRef, {
            imageUrl: newImageUrl,
          });
          Alert.alert('Success', 'Station image updated successfully!');
        } catch (error) {
          console.error('Error updating station image URL:', error);
          Alert.alert('Error', 'Failed to update station image: ' + error.message);
        }
      }
    }
  };

  const renderAverageStars = (avgRating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= avgRating ? 'star' : 'star-outline'}
          size={20}
          color={i <= avgRating ? '#FFD700' : '#ccc'}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.averageStarContainer}>{stars}</View>;
  };

  // Back button handler function
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainMap');
    }
  };

  // Primary rendering guard: If station is still not valid, show loading/error state
  if (!station || !station.id) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0077b6" />
        <Text style={styles.loadingText}>Loading station details...</Text>
        <Text style={styles.loadingText}>If this persists, please try again from the map.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{station.name}</Text>
        <View style={styles.ratingSummary}>
          {renderAverageStars(averageRating)}
          <Text style={styles.ratingText}>
            {averageRating.toFixed(1)}/5 ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
          </Text>
        </View>

        {currentImageUrl ? (
          <Image source={{ uri: currentImageUrl }} style={styles.stationImage} />
        ) : (
          <Image
            source={{ uri: `https://placehold.co/600x400/87CEFA/FFFFFF?text=No+Image` }}
            style={styles.stationImage}
          />
        )}
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={handleUpdateStationImage}
          disabled={uploadingImage}
        >
          <Text style={styles.addImageButtonText}>
            {uploadingImage ? 'Uploading Image...' : 'Add/Update Image'}
          </Text>
          {uploadingImage && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />}
        </TouchableOpacity>


        <Text style={styles.detailText}>Address: {station.address}</Text>
        <Text style={styles.detailText}>Description: {station.description}</Text>
        <Text style={styles.detailText}>Water Type: {station.waterType}</Text>
        <Text style={styles.detailText}>Accessibility: {station.accessibility}</Text>
        <Text style={styles.detailText}>
          Location: Lat {station.latitude?.toFixed(5)}, Lon {station.longitude?.toFixed(5)}
        </Text>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.writeReviewButton} onPress={handleWriteReview}>
          <Text style={styles.writeReviewButtonText}>Write/Edit Your Review</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>User Reviews</Text>
        {fetchingReviews ? (
          <ActivityIndicator size="large" color="#0077b6" />
        ) : reviews.length === 0 ? (
          <Text style={styles.noReviewsText}>No reviews yet. Be the first to add one!</Text>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUserName}>{review.userName}</Text>
                <View style={styles.reviewStars}>
                  {[...Array(review.rating)].map((_, i) => (
                    <Ionicons key={i} name="star" size={16} color="#FFD700" />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>
                {review.createdAt?.toDate().toLocaleDateString()}
              </Text>
            </View>
          ))
        )}

        <View style={styles.separator} />

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteStation}
          disabled={deletingStation}
        >
          <Text style={styles.deleteButtonText}>
            {deletingStation ? 'Deleting...' : 'Delete Station'}
          </Text>
          {deletingStation && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />}
        </TouchableOpacity>
      </ScrollView>

      {/* Nút Back mới ở góc dưới bên phải */}
      <TouchableOpacity style={styles.bottomRightBackButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={styles.bottomRightBackButtonText}>Back to Map</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0077b6',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  backButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#0077b6',
  },
  title: {
    fontSize: 28,
    color: '#0077b6',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  averageStarContainer: {
    flexDirection: 'row',
    marginRight: 5,
  },
  ratingText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  stationImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  addImageButton: {
    backgroundColor: '#00b4d8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addImageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0077b6',
    marginBottom: 15,
    textAlign: 'center',
  },
  noReviewsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  reviewItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewUserName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0077b6',
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  reviewDate: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  writeReviewButton: {
    backgroundColor: '#0077b6',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeReviewButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
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
    shadowColor: '#000', //  iOS
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