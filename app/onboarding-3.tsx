import { LinearGradient } from 'expo-linear-gradient';
import { Href, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive dimensions
const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 800;
const isLargeScreen = height >= 800;

// Responsive sizes
const imageSize = isSmallScreen ? 120 : isMediumScreen ? 140 : 160;
const titleFontSize = isSmallScreen ? 20 : isMediumScreen ? 22 : 24;
const subtitleFontSize = isSmallScreen ? 14 : isMediumScreen ? 15 : 16;

export default function OnboardingScreen3() {
  const handleNext = () => {
    router.push('/login/login' as Href);
  };


  return (
    <LinearGradient
      colors={['#a8d5ff', '#b8e0ff']}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      {/* Status Bar Space */}
      <View style={styles.statusBar} />
      
      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.contentWrapper}>
          {/* Hero Title */}
          <Text style={[styles.title, { fontSize: titleFontSize }]}>
            Battle the Germy{'\n'}Monsters
          </Text>

          {/* Hero Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/hero.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { fontSize: subtitleFontSize }]}>
            Enjoy <Text style={styles.subtitleBold}>fun learning</Text> and Protect your world with clean water and sanity, and make it shine bright.
          </Text>

          {/* Progress indicators */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDotInactive} />
            <View style={styles.progressDotInactive} />
            <View style={styles.progressDot} />
          </View>
        </View>
      </View>

      {/* Get Started Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <LinearGradient
            colors={['#4f94e6', '#2f6fd6']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    minHeight: height,
  },
  statusBar: {
    height: 48,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: isSmallScreen ? 20 : 24,
    paddingTop: isSmallScreen ? 40 : 60,
    paddingBottom: isSmallScreen ? 20 : 32,
  },
  contentWrapper: {
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#003d7a',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 26 : isMediumScreen ? 28 : 32,
    marginBottom: isSmallScreen ? 20 : 32,
  },
  imageContainer: {
    width: '100%',
    height: isSmallScreen ? 200 : 280,
    marginBottom: isSmallScreen ? 20 : 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  subtitle: {
    color: '#1e3a5f',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
    marginBottom: isSmallScreen ? 24 : 32,
    paddingHorizontal: isSmallScreen ? 4 : 8,
  },
  subtitleBold: {
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallScreen ? 16 : 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    backgroundColor: '#7bb3e8',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  progressDotInactive: {
    width: 8,
    height: 8,
    backgroundColor: '#b8d4f0',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    paddingHorizontal: isSmallScreen ? 20 : 24,
    paddingBottom: isSmallScreen ? 50 : 70,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});