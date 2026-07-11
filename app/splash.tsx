import { router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 800;
const logoSize = isSmallScreen ? 200 : isMediumScreen ? 240 : 280;

export default function SplashScreen() {
  const pathname = usePathname();

  const handleTap = () => {
    router.replace('/onboarding');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleTap} activeOpacity={0.9}>
      <StatusBar style="dark" />
      <Image
        source={require('@/assets/images/logo2.png')}
        style={[styles.logo, { width: logoSize, height: logoSize }]}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cfe6ff',
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
  },
  logo: {
    marginBottom: 20,
  },
});
