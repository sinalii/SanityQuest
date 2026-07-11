import { auth, db } from '@/config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserCount();
  }, []);

  const fetchUserCount = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      setUserCount(usersSnapshot.size);
    } catch (error: any) {
      console.error('Error fetching user count:', error);
      // If permission error, set count to 0 instead of showing alert
      if (error.code === 'permission-denied') {
        console.warn('Admin needs Firebase authentication to view user data');
        setUserCount(0);
      } else {
        Alert.alert('Error', 'Failed to fetch user statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/login/login');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={["#d7e9ff", "#cfe6ff"]}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Public Health</Text>
            <Text style={styles.welcomeText}>Dashboard</Text>
            <Text style={styles.subtitle}>Hygiene Heroes Management</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#8b5cf6', '#a78bfa']}
              style={styles.statCardGradient}
            >
              {loading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <>
                  <Text style={styles.statNumber}>{userCount}</Text>
                  <Text style={styles.statLabel}>Total Users</Text>
                </>
              )}
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#ec4899', '#f472b6']}
              style={styles.statCardGradient}
            >
              {loading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <>
                  <Text style={styles.statNumber}>{userCount}</Text>
                  <Text style={styles.statLabel}>Active Children</Text>
                </>
              )}
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#06b6d4', '#22d3ee']}
              style={styles.statCardGradient}
            >
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Game Sessions</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#10b981', '#34d399']}
              style={styles.statCardGradient}
            >
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/admin/lesson-management' as any)}
          >
            <LinearGradient
              colors={['#8b5cf6', '#a78bfa']}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>� Lesson Management</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0052cc',
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0052cc',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 62, 62, 0.71)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statCardGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0052cc',
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  activityText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activitySubtext: {
    color: '#c4b5fd',
    fontSize: 14,
  },
});
