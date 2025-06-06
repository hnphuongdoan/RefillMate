import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const handleAddStation = async () => {
  try {
    const stationData = {
      name: stationName.trim(),
      address: address.trim(),
      latitude: initialCoords.latitude,
      longitude: initialCoords.longitude,
      description: description.trim(),
      waterType: waterType.trim(),
      accessibility: accessibility.trim(),
      createdAt: Timestamp.now(),
    };

    await addDoc(collection(db, 'waterStations'), stationData);

    Alert.alert('Success', 'Water station added!');
    navigation.goBack();
  } catch (err) {
    console.error(err);
    Alert.alert('Error', 'Could not add station.');
  }
};