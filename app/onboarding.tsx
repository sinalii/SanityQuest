import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 800;

const imageSize = isSmallScreen ? 180 : isMediumScreen ? 220 : 260;
const titleFontSize = isSmallScreen ? 22 : isMediumScreen ? 26 : 30;
const subtitleFontSize = isSmallScreen ? 12 : isMediumScreen ? 14 : 16;

export default function OnboardingScreen1() {
  const handleNext = () => router.push('/onboarding-2');


  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={["#d7e9ff", "#cfe6ff"]}
        style={styles.container}
      >
        <StatusBar style="dark" />

        <View style={styles.topSpacer} />

        <View style={styles.decorCircle} />

        <View style={styles.content}>
        <Text style={[styles.title, { fontSize: titleFontSize }]}>Welcome to{"\n"}<Text style={styles.titleAccent}>Hygiene Hero!</Text></Text>

        <View style={[styles.imageElevated, { width: imageSize + 24, height: imageSize + 24, borderRadius: (imageSize + 24) / 2 }]}> 
          <View style={[styles.imageWrap, { width: imageSize, height: imageSize, borderRadius: imageSize / 2 }]}> 
            <Image
              source={require('@/assets/images/onboardingnew1.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={[styles.subtitle, { fontSize: subtitleFontSize }]}>Dive into bubbles and fun learning.{"\n"}Discover the magic of <Text style={styles.bold}>clean water</Text> every day!</Text>

        <View style={styles.progressRow}>
          <View style={styles.progressDotActive} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={() => router.replace('/onboarding-2')}>
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
  topSpacer: {
    height: 56,
  },
  decorCircle: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(15,78,168,0.06)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 8,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    color: '#0f4ea8',
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 12,
  },
  titleAccent: {
    color: '#064e9b',
  },
  imageElevated: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  imageWrap: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  subtitle: {
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#0f4ea8',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0f4ea8',
    marginHorizontal: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#41cae2ff',
    marginHorizontal: 6,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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