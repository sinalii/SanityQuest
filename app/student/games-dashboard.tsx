import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function GamingDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'learning'>('all');

  const handlePlayGame = (gameName: string) => {
    // push('/handwashing-hero');
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
          <TouchableOpacity onPress={() => router.push('/student/dashboard')} style={styles.backButtonText}>
            <Image
              source={require('../../assets/backArrow.png')}
              style={{ width: 24, height: 24, tintColor: '#0052cc' }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Gaming Dashboard</Text>
        </View>


        {/* Game Cards */}
        <View style={styles.gamesContainer}>
          {/* Handwashing Hero */}
          <View style={styles.gameCard}>
            <LinearGradient
              colors={['#c4b5fd', '#ddd6fe']}
              style={styles.gameCardGradient}
            >
              <View style={styles.gameImageContainer}>
                <Image
                  source={require('../../assets/game/hand_washing_soap.png')}
                  style={{ width: 80, height: 80, resizeMode: 'contain' }}
                  accessibilityLabel="Hand washing soap"
                />
              </View>
              <Text style={styles.gameTitle}>Handwashing Hero</Text>
              <Text style={styles.gameDescription}>Learn handwashing with interactive fun</Text>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => router.push('/handwashing-hero')}
              >
                <Text style={styles.playButtonText}>Play</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Catch the Water Drops */}
          <View style={styles.gameCard}>
            <LinearGradient
              colors={['#86efac', '#bbf7d0']}
              style={styles.gameCardGradient}
            >
              <View style={styles.gameImageContainer}>
                <Image
                  source={require('../../assets/game/catchWaterDrop.png')}
                  style={{ width: 80, height: 80, resizeMode: 'contain' }}
                  accessibilityLabel="Catch the Water Drops"
                />
              </View>
              <Text style={styles.gameTitle}>Catch the Water Drops</Text>
              <Text style={styles.gameDescription}>Catch falling drops and learn water conservation</Text>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => router.push('/student/catch-water-drops-game')}
              >
                <Text style={styles.playButtonText}>Play</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Germ Buster Lab */}
          <View style={styles.gameCard}>
            <LinearGradient
              colors={['#fdba74', '#fcd34d']}
              style={styles.gameCardGradient}
            >
              <View style={styles.gameImageContainer}>
                <Image
                  source={require('../../assets/game/germ.png')}
                  style={{ width: 80, height: 80, resizeMode: 'contain' }}
                  accessibilityLabel="Germ Buster Lab"
                />
              </View>
              <Text style={styles.gameTitle}>Germ Buster Lab</Text>
              <Text style={styles.gameDescription}>Fight germs and keep hands clean</Text>
              <TouchableOpacity
                style={styles.playButton}
               onPress={() => router.push('/GermLabFolder/game')}
              >
                <Text style={styles.playButtonText}>Play</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0052cc',
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: '#1f2937',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  categoryContainer: {
    marginBottom: 30,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  categoryButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  categoryButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryButtonActive: {
    elevation: 4,
    shadowOpacity: 0.2,
  },
  categoryButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  gamesContainer: {
    gap: 20,
  },
  gameCard: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gameCardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  gameImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gameEmoji: {
    fontSize: 50,
  },
  gameTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  gameDescription: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  playButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
});
