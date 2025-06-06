// screens/ReviewScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db, auth } from '../config/firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function AddReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // Get station ID from params
  const { stationId, stationName } = route.params;

  const [rating, setRating] = useState(0); // User's selected rating (1-5)
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleAddReview = async () => {
    if (rating === 0) {
      Alert.alert('Missing Rating', 'Please provide a star rating.');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Missing Comment', 'Please write a comment for your review.');
      return;
    }
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'You must be logged in to submit a review.');
      return;
    }

    setSubmittingReview(true);
    try {
      const reviewsCollectionRef = collection(db, 'waterStations', stationId, 'reviews');
      await addDoc(reviewsCollectionRef, {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.email || 'Anonymous', // Use email or display name
        rating: rating,
        comment: comment.trim(),
        createdAt: Timestamp.now(),
      });
      Alert.alert('Success', 'Review submitted successfully!');
      // Navigate back to the StationDetailScreen after submitting review
      navigation.goBack();
    } catch (error) {
      console.error('Error adding review: ', error);
      Alert.alert('Error', 'Failed to submit review: ' + error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (currentRating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} disabled={submittingReview}>
          <Ionicons
            name={i <= currentRating ? 'star' : 'star-outline'}
            size={40} // Larger stars for dedicated review screen
            color={i <= currentRating ? '#FFD700' : '#ccc'}
            style={{ marginRight: 5 }}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0077b6" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Write a Review</Text>
        <Text style={styles.subtitle}>For: {stationName}</Text>

        <View style={styles.separator} />

        {/* Review Submission Section */}
        <Text style={styles.sectionTitle}>Your Rating:</Text>
        {renderStars(rating)}
        <Text style={styles.sectionTitle}>Your Comments:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write your comment..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={5}
          value={comment}
          onChangeText={setComment}
          editable={!submittingReview}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleAddReview} disabled={submittingReview}>
          <Text style={styles.submitButtonText}>
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </Text>
          {submittingReview && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />}
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
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0077b6',
    marginBottom: 15,
    textAlign: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
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
  textArea: {
    height: 120, // Tăng chiều cao cho khung comment
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  submitButton: {
    backgroundColor: '#28a745', // Green color for submit review
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
});
