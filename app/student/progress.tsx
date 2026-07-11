import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProgressScreen() {
  // Hardcoded progress data for demonstration
  const gameProgress = [
    { name: 'Handwashing Hero', progress: 85, color: '#8b5cf6' },
    { name: 'Catching the Water Drops', progress: 60, color: '#10b981' },
    { name: 'Germ Buster Lab', progress: 100, color: '#f59e0b' },
  ];

  // Hardcoded badges data
  const earnedBadges = [
    { id: 1, name: 'First Steps', emoji: '👶', color: '#fbbf24' },
    { id: 2, name: 'Clean Hands', emoji: '🧼', color: '#34d399' },
    { id: 3, name: 'Water Saver', emoji: '💧', color: '#60a5fa' },
    { id: 4, name: 'Germ Fighter', emoji: '🦠', color: '#f472b6' },
    { id: 5, name: 'Quiz Master', emoji: '🧠', color: '#a78bfa' },
    { id: 6, name: 'Super Star', emoji: '⭐', color: '#fbbf24' },
  ];

  const renderProgressBar = (game: typeof gameProgress[0], index: number) => (
    <View key={index} style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <Text style={styles.gameName}>{game.name}</Text>
        <Text style={styles.progressPercentage}>{game.progress}%</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${game.progress}%`,
                backgroundColor: game.color 
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );

  const renderBadge = (badge: typeof earnedBadges[0], index: number) => (
    <View key={badge.id} style={[styles.badgeItem, { backgroundColor: badge.color }]}>
      <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
      <Text style={styles.badgeName}>{badge.name}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={["#d7e9ff", "#cfe6ff"]}
      style={styles.container}
    >
      <StatusBar style="dark" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Image
              source={require('../../assets/backArrow.png')}
              style={{ width: 24, height: 24, tintColor: '#0052cc' }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Progress</Text>
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Progress</Text>
          <View style={styles.progressContainer}>
            {gameProgress.map(renderProgressBar)}
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earned Badges</Text>
          <View style={styles.badgesContainer}>
            {earnedBadges.map(renderBadge)}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  progressContainer: {
    gap: 20,
  },
  progressItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 14,
  },
});
