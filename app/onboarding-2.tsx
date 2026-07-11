import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive dimensions
const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 800;
const isLargeScreen = height >= 800;

export default function OnboardingScreen2() {
  const handleNext = () => {
    router.push('/onboarding-3');
  };

  const handleSkip = () => {
    router.back();
  };


  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={["#d7e9ff", "#cfe6ff"]}
        style={styles.container}
      >
        <StatusBar style="dark" />
      
        {/* Background bubbles */}
        <View style={[styles.bubble, styles.bubble1]} />
        <View style={[styles.bubble, styles.bubble2]} />
        <View style={[styles.bubble, styles.bubble3]} />
        <View style={[styles.bubble, styles.bubble4]} />
        <View style={[styles.bubble, styles.bubble5]} />
      
      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.contentWrapper}>
          {/* Title */}
          <Text style={styles.title}>Be a Hygiene Hero</Text>

          {/* Illustration area */}
          <View style={styles.illustrationContainer}>
            {/* Replace with your actual illustration image */}
            <Image
              source={require('@/assets/images/onboarding2.png')}
              style={styles.illustration}
              resizeMode="contain"
              onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
            />
            
          </View>
        

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Wash, splash, and stay strong.{'\n'}
              Practice <Text style={styles.boldText}>health safety</Text> and unlock{'\n'}
              rewards!
            </Text>
          </View>

          {/* Pagination dots */}
          <View style={styles.paginationContainer}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
          </View>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient colors={["#4f94e6", "#2f6fd6"]} style={styles.nextGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.nextText}>Next</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  bubble: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(135, 185, 224, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  bubble1: {
    width: 80,
    height: 80,
    top: 150,
    left: 30,
  },
  bubble2: {
    width: 30,
    height: 30,
    top: 160,
    left: 150,
  },
  bubble3: {
    width: 40,
    height: 40,
    top: 180,
    right: 40,
  },
  bubble4: {
    width: 50,
    height: 50,
    top: 240,
    left: 50,
  },
  bubble5: {
    width: 60,
    height: 60,
    top: 210,
    right: 20,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: isSmallScreen ? 60 : 80,
    paddingHorizontal: 20,
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: '800',
    color: '#0f4ea8',
    textAlign: 'center',
    marginBottom: isSmallScreen ? 30 : 40,
    lineHeight: 40,
  },
illustrationContainer: {
    width: isSmallScreen ? 250 : 300,
    height: isSmallScreen ? 250 : 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    borderRadius: (isSmallScreen ? 250 : 200) / 2, 
    overflow: 'hidden', // 
    backgroundColor: 'rgba(255, 255, 255, 0.3)', 
  },
  illustration: {
    width: '90%',
    height: '90%',
  },
  illustrationPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationText: {
    fontSize: 80,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 24,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0f4ea8',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#41cae2ff',
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#0f4ea8',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomNav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 44,
  },
  skipButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  skipText: {
    color: '#0f4ea8',
    fontSize: 16,
    fontWeight: '700',
  },
  nextButton: {
    width: 96,
    borderRadius: 24,
    overflow: 'hidden',
  },
  nextGradient: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});