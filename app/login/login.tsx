import { signIn } from '@/config/auth';
import { db } from '@/config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive dimensions
const isSmallScreen = height < 600;
const isMediumScreen = height >= 600 && height < 700;
const isLargeScreen = height >= 700;

// Responsive logo sizes
const logoWidth = isSmallScreen ? 100 : isMediumScreen ? 120 : 140;
const logoHeight = isSmallScreen ? 100 : isMediumScreen ? 120 : 140;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('Login attempt with:', { email, password: password ? '***' : 'empty' });
    
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    try {
      setLoading(true);
      console.log('Calling signIn function...');
      const { user, role } = await signIn(email, password);
      console.log('Sign in successful:', { uid: user.uid, role });
      
      // Route based on role
      if (role === 'admin') {
        console.log('Routing to admin dashboard');
        router.push('/admin/dashboard' as Href);
      } else if (role === 'unofficer') {
        console.log('Routing to UN officer dashboard');
        router.push('/unofficer/dashboard' as Href);
      } else {
        console.log('Checking child profile for student...');
        // Check if student has a child profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        console.log('User data from Firestore:', userData);
        
        if (userData?.childProfile) {
          console.log('Child profile exists, routing to student dashboard');
          // Profile exists, go to student dashboard
          router.push('/student/dashboard' as Href);
        } else {
          console.log('No child profile, routing to create profile');
          // No profile, go to create profile
          router.push('/child_profile/child_profile' as Href);
        }
      }
    } catch (e: any) {
      console.error('Login error:', e);
      const message = e?.message || 'Sign in failed. Please try again.';
      Alert.alert('Sign in error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/register/register');
  };

  return (
    <LinearGradient
      colors={['#a8d5ff', '#b8e0ff']}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <View style={styles.content}>
        {/* Logo and Branding */}
        <View style={styles.brandingContainer}>
          <Image 
            source={require('@/assets/images/logo2.png')} 
            style={[styles.logo, { width: logoWidth, height: logoHeight }]}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>Hygiene Heroes</Text>
          <Text style={styles.brandSubtitle}>Keep clean, stay healthy!</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              <LinearGradient
                colors={['#0052cc', '#003d99']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginButtonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>Don't have account? <Text style={styles.signUpLink}>Register</Text></Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.unOfficerButton} 
              onPress={() => router.push('/unofficer/login')}
            >
              <Text style={styles.unOfficerButtonText}>UN Officer Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 24 : 32,
  },
  logo: {
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 28,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#0052cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  signUpButton: {
    paddingVertical: 12,
  },
  signUpButtonText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  signUpLink: {
    color: '#0052cc',
    fontWeight: '600',
  },
  unOfficerButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(30, 58, 138, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e3a8a',
  },
  unOfficerButtonText: {
    color: '#1e3a8a',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});