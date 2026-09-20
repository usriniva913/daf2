import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { graphql } from '../api';

const PURPLE = '#7C7EFF';
const DEFAULT_RADIUS_KM = 25;
const DEFAULT_LATITUDE = 40.4268; // Default to a central location
const DEFAULT_LONGITUDE = -86.9084; // Default to a central location

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNearbySessions = useCallback(async () => {
    if (!location) return;
    
    setLoading(true);
    setError(null);
    try {
      const QUERY = `
        query GetNearbySessions($latitude: Float!, $longitude: Float!, $radiusKm: Float!) {
          getNearbySessions(latitude: $latitude, longitude: $longitude, radiusKm: $radiusKm) {
            id
            sport
            date
            time
            location
            coordinates {
              type
              coordinates
            }
            skillRange
            maxParticipants
            participants {
              id
              name
              skillLevel
              socialRating
            }
            host {
              id
              name
            }
            status
          }
        }
      `;
      const data = await graphql(QUERY, {
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: DEFAULT_RADIUS_KM
      });
      setSessions(data.getNearbySessions || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [location]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLocation({
          latitude: DEFAULT_LATITUDE,
          longitude: DEFAULT_LONGITUDE
        });
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      });
    })();
  }, []);

  useEffect(() => {
    if (location) {
      fetchNearbySessions();
    }
  }, [location, fetchNearbySessions]);

  const handleMarkerPress = (session) => {
    setSelectedSession(session);
    setModalVisible(true);
  };

  const renderSessionCard = () => {
    if (!selectedSession) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.sportBadge}>{selectedSession.sport}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sessionLocation}>{selectedSession.location}</Text>
            <Text style={styles.sessionDate}>{selectedSession.date} at {selectedSession.time}</Text>
            
            <View style={styles.sessionDetails}>
              <Text style={styles.detailLabel}>Host:</Text>
              <Text style={styles.detailValue}>{selectedSession.host?.name || 'Unknown'}</Text>
            </View>
            
            <View style={styles.sessionDetails}>
              <Text style={styles.detailLabel}>Skill Level:</Text>
              <Text style={styles.detailValue}>{selectedSession.skillRange}</Text>
            </View>
            
            <View style={styles.sessionDetails}>
              <Text style={styles.detailLabel}>Participants:</Text>
              <Text style={styles.detailValue}>
                {selectedSession.participants?.length || 0} / {selectedSession.maxParticipants || 6}
              </Text>
            </View>
            
            <View style={styles.sessionDetails}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, styles.statusText]}>
                {selectedSession.status?.replace('_', ' ') || 'Unknown'}
              </Text>
            </View>

            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (errorMsg && !location) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PURPLE} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {sessions.map((session) => {
          if (!session.coordinates || !session.coordinates.coordinates) return null;
          
          const [longitude, latitude] = session.coordinates.coordinates;
          
          return (
            <Marker
              key={session.id}
              coordinate={{ latitude, longitude }}
              onPress={() => handleMarkerPress(session)}
            >
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutText}>{session.sport}</Text>
                  <Text style={styles.calloutSubtext}>{session.location}</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={PURPLE} />
          <Text style={styles.loadingText}>Loading nearby sessions...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>Error loading sessions</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNearbySessions}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && sessions.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Text style={styles.emptyText}>No sessions nearby</Text>
          <Text style={styles.emptySubtext}>Try increasing your search radius</Text>
        </View>
      )}

      {renderSessionCard()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#666', fontSize: 14 },
  errorText: { fontSize: 16, color: '#c00', textAlign: 'center' },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryBtn: { marginTop: 8, backgroundColor: PURPLE, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyOverlay: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: '#666' },
  callout: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  calloutText: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  calloutSubtext: { fontSize: 12, color: '#666' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportBadge: {
    backgroundColor: PURPLE,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '600',
    overflow: 'hidden',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  sessionLocation: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  sessionDate: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
  },
  sessionDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  statusText: {
    textTransform: 'capitalize',
  },
  joinButton: {
    backgroundColor: PURPLE,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});