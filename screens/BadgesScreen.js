// screens/BadgesScreen.js
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function BadgesScreen() {
  const navigation = useNavigation();

  // Hardcoded example badges for simplification
  const badges = [
    {
      id: '1',
      name: 'First Contributor',
      description: 'Added your first water station!',
      icon: 'sparkles',
      earned: true,
    },
    {
      id: '2',
      name: 'Reviewer Extraordinaire',
      description: 'Submitted 10 reviews for water stations.',
      icon: 'chatbubbles-outline',
      earned: false,
    },
    {
    id: '3',
    name: 'Eco-Champion',
    description: 'Contributed to 20 unique water stations.',
    icon: 'leaf-outline',
    earned: false,
    },
    {
    id: '4',
    name: 'Hydration Hero',
    description: 'Helped 50 people find water stations.',
    icon: 'water-outline',
    earned: true,
    },
  ];

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
        <Text style={styles.title}>Your Badges</Text>

        {badges.map((badge) => (
          <View key={badge.id} style={styles.badgeCard}>
            <Ionicons
              name={badge.icon}
              size={40}
              color={badge.earned ? '#FFD700' : '#A9A9A9'} // Gold if earned, grey if not
              style={styles.badgeIcon}
            />
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>
              <Text style={badge.earned ? styles.earnedStatus : styles.notEarnedStatus}>
                {badge.earned ? 'Earned!' : 'Not yet earned'}
              </Text>
            </View>
          </View>
        ))}
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
  badgeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeIcon: {
    marginRight: 15,
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  earnedStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745', // Green for earned
    marginTop: 5,
  },
  notEarnedStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc3545', // Red for not earned
    marginTop: 5,
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
    elevation: 5, //Android
    shadowColor: '#000', //IOS
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
