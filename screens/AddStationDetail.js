// screens/StationDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput, 
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db, auth } from '../config/firebaseConfig';
import { doc, collection, addDoc, onSnapshot, query, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function StationDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { station } = route.params;

  const [reviews, setReviews] = useState([]);
  const [fetchingReviews, setFetchingReviews] = useState(true);
  const [deletingStation, setDeletingStation] = useState(false);

  useEffect(() => {
    if (station && station.id) {
      const reviewsCollectionRef = collection(db, 'waterStations', station.id, 'reviews');
      const q = query(reviewsCollectionRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedReviews = [];
        querySnapshot.forEach((doc) => {
          fetchedReviews.push({ id: doc.id, ...doc.data() });
        });
        setReviews(fetchedReviews);
        setFetchingReviews(false);
      }, (error) => {
        console.error("Error fetching reviews:", error);
        Alert.alert("Error", "Failed to load reviews: " + error.message);
        setFetchingReviews(false);
      });

      return () => unsubscribe();
    }
  }, [station]);

  // Function to handle station deletion
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

  // NEW: Function to navigate to AddReviewScreen
  const handleWriteReview = () => {
    navigation.navigate('AddReview', { stationId: station.id, stationName: station.name });
  };


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0077b6" />
          <Text style={styles.backButtonText}>Back to Map</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{station.name}</Text>
        {station.imageUrl && (
          <Image source={{ uri: station.imageUrl }} style={styles.stationImage} />
        )}
        <Text style={styles.detailText}>Address: {station.address}</Text>
        <Text style={styles.detailText}>Description: {station.description}</Text>
        <Text style={styles.detailText}>Water Type: {station.waterType}</Text>
        <Text style={styles.detailText}>Accessibility: {station.accessibility}</Text>
        <Text style={styles.detailText}>
          Location: Lat {station.latitude.toFixed(5)}, Lon {station.longitude.toFixed(5)}
        </Text>

        <View style={styles.separator} />

        {/* NEW: Button to navigate to Review Screen */}
        <TouchableOpacity style={styles.writeReviewButton} onPress={handleWriteReview}>
          <Text style={styles.writeReviewButtonText}>Write/Edit Your Review</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Reviews List Section (remains here) */}
        <Text style={styles.sectionTitle}>User Reviews</Text> {/* Changed to "User Reviews" */}
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

        {/* Delete Station Button */}
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
  stationImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: 'cover',
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
  // Removed starContainer, input, textArea, reviewButton, reviewButtonText styles as they moved
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
  writeReviewButton: { // NEW style for the review button
    backgroundColor: '#0077b6', // Blue color
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeReviewButtonText: { // NEW style for the review button text
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
