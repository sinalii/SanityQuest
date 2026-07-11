import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Firebase imports
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  auth,
  CORS_PROXY,
  db,
  REPLICATE_API_TOKEN,
  REPLICATE_API_URL,
  REPLICATE_AVATAR_MODEL,
  USE_CORS_PROXY
} from '../../config/firebase';

const { width, height } = Dimensions.get('window');

// Professional avatar options
const avatarOptions = [
  { id: 'child1', image: require('../../assets/images/avatar_child_1.png'), label: 'Child', category: 'children' },
  { id: 'child2', image: require('../../assets/images/avatar_child_2.png'), label: 'Child', category: 'children' },
  { id: 'child3', image: require('../../assets/images/avatar_child_3.png'), label: 'Child', category: 'children' },
  { id: 'animal1', image: require('../../assets/images/avatar_animal_1.png'), label: 'Dog', category: 'animals' },
  { id: 'animal2', image: require('../../assets/images/avatar_animal_2.png'), label: 'Cat', category: 'animals' },
  { id: 'animal3', image: require('../../assets/images/avatar_animal_3.png'), label: 'Rabbit', category: 'animals' },
  { id: 'character1', image: require('../../assets/images/avatar_hero_1.png'), label: 'Superhero', category: 'hero' },
  { id: 'character2', image: require('../../assets/images/avatar_hero_2.png'), label: 'Superhero', category: 'hero' },
  { id: 'character3', image: require('../../assets/images/avatar_hero_3.png'), label: 'Robot', category: 'hero' },
];

export default function ChildProfileScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [activeCategory, setActiveCategory] = useState('children');
  const [saving, setSaving] = useState(false);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSaveProfile = async () => {
    if (!name || !age || !selectedAvatar) {
      Alert.alert('Incomplete Profile', 'Please fill in all fields and select an avatar.');
      return;
    }
    
    const parsedAge = parseInt(String(age).trim(), 10);
    if (Number.isNaN(parsedAge) || parsedAge <= 0) {
      Alert.alert('Invalid Age', 'Please enter a valid age.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Not signed in', 'Please log in again.');
      router.replace('/login/login' as Href);
      return;
    }

    try {
      setSaving(true);
      
      const profileData: any = {
        name: name.trim(),
        age: parsedAge,
        avatarId: selectedAvatar,
        updatedAt: serverTimestamp(),
      };

      // If generated avatar is selected, save the image URL
      if (selectedAvatar === 'generated' && generatedAvatar) {
        profileData.generatedAvatarUrl = generatedAvatar;
        profileData.platform = Platform.OS; // Track which platform generated the avatar
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          childProfile: profileData,
        },
        { merge: true }
      );
    router.replace('/student/dashboard');
    } catch (e: any) {
      const message = e?.message || 'Failed to save profile. Please try again.';
      Alert.alert('Save error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleUploadPhoto = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAndGenerateAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error in handleUploadPhoto:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const convertImageToBase64 = async (imageUri: string): Promise<string> => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error: any) {
      throw new Error(`Failed to convert image: ${error?.message || 'Unknown error'}`);
    }
  };

  const uploadAndGenerateAvatar = async (imageUri: string) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Not signed in', 'Please log in again.');
      return;
    }

    try {
      setUploading(true);
      
      // Convert image to base64 data URL for Replicate API (works on both web and mobile)
      const downloadURL = await convertImageToBase64(imageUri);
      
      // Generate cartoon avatar using Replicate API
      await generateCartoonAvatar(downloadURL);
      
    } catch (error: any) {
      // Check if it's a CORS error
      if (error?.message?.includes('CORS') || error?.message?.includes('XMLHttpRequest')) {
        Alert.alert(
          'CORS Error', 
          'This feature works better on mobile devices. Please try on Android/iOS or use a different browser with CORS disabled.'
        );
      } else if (error?.message?.includes('Failed to fetch') || error?.name === 'AbortError') {
        Alert.alert(
          'Network Error', 
          'Failed to connect to the avatar generation service. Please check your internet connection and try again.'
        );
      } else {
        Alert.alert('Upload Error', `Failed to upload image: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const generateCartoonAvatar = async (imageUrl: string) => {
    try {
      setGenerating(true);
      
      // Create prediction
      const requestBody = {
        version: REPLICATE_AVATAR_MODEL,
        input: {
          input_image: imageUrl,
          prompt: "img cartoon avatar, cute character, animated style, colorful, friendly superhero",
          negative_prompt: "realistic, photograph, dark, scary",
          num_steps: 20,
          style_strength_ratio: 20,
          num_outputs: 1,
          guidance_scale: 5,
          seed: Math.floor(Math.random() * 100000), // Random positive integer for seed
          apply_watermark: false
        }
      };
      
      // Use CORS proxy for web platform if enabled
      const apiUrl = (Platform.OS === 'web' && USE_CORS_PROXY) 
        ? `${CORS_PROXY}${REPLICATE_API_URL}`
        : REPLICATE_API_URL;
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const prediction = await response.json();
      
      // Poll for completion
      let result = prediction;
      let pollCount = 0;
      const maxPolls = 60; // 60 seconds max
      
      while (result.status !== 'succeeded' && result.status !== 'failed' && pollCount < maxPolls) {
        pollCount++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusController = new AbortController();
        const statusTimeoutId = setTimeout(() => statusController.abort(), 10000);
        
        // Use CORS proxy for status checks too
        const statusUrl = (Platform.OS === 'web' && USE_CORS_PROXY)
          ? `${CORS_PROXY}${REPLICATE_API_URL}/${result.id}`
          : `${REPLICATE_API_URL}/${result.id}`;
        
        const statusResponse = await fetch(statusUrl, {
          headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          },
          signal: statusController.signal
        });
        
        clearTimeout(statusTimeoutId);
        
        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.status}`);
        }
        
        result = await statusResponse.json();
      }

      if (pollCount >= maxPolls) {
        throw new Error('Generation timeout - took too long');
      }

      if (result.status === 'succeeded' && result.output && result.output.length > 0) {
        setGeneratedAvatar(result.output[0]);
        setSelectedAvatar('generated');
      } else {
        throw new Error(`Failed to generate avatar: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      if (error?.message?.includes('CORS') || error?.message?.includes('Failed to fetch')) {
        Alert.alert(
          'Network Error', 
          'Cannot connect to avatar generation service. This might be due to network restrictions or CORS policies. Please try on a mobile device or check your internet connection.'
        );
      } else {
        Alert.alert('AI Generation Error', `Failed to generate cartoon avatar: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  // Debug functions removed

  const categories = [
    { id: 'children', label: 'Child', color: '#4F46E5' },
      { id: 'animals', label: 'Animal', color: '#059669' },
      { id: 'hero', label: 'Hero', color: '#DC2626' }
  ];

  const filteredAvatars = avatarOptions.filter(avatar => avatar.category === activeCategory);

  return (
    <LinearGradient colors={['#C9D9F8', '#C9D9F8']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Unified Profile Card */}
        <View style={styles.section}>
          {/* Centered Title */}
          <View style={styles.centeredTitleSection}>
            <Text style={styles.title}>Child Profile</Text>
            <Text style={styles.subtitle}>Create your profile and choose your avatar!</Text>
          </View>
          
          {/* Personal Information */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter Your Name Here"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Enter Your Age Here"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Avatar Selection */}
          <View style={styles.avatarSection}>
            <Text style={styles.avatarSectionTitle}>Pick Your Avatar</Text>
            
              {/* Category Tabs */}
            <View style={styles.categoryTabs}>
                {categories.map((category) => (
                <TouchableOpacity
                    key={category.id}
                  onPress={() => setActiveCategory(category.id)}
                  style={[
                    styles.categoryTab,
                    activeCategory === category.id && styles.activeCategoryTab
                  ]}
                >
                  <Text style={[
                    styles.categoryTabText,
                    activeCategory === category.id && styles.activeCategoryTabText
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
                ))}
            </View>

              {/* Avatar Grid */}
            <View style={styles.avatarGrid}>
                {filteredAvatars.map((avatar) => (
                <TouchableOpacity
                    key={avatar.id}
                  onPress={() => setSelectedAvatar(avatar.id)}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === avatar.id && styles.selectedAvatarOption
                  ]}
                >
                  <Image source={avatar.image} style={styles.avatarImage} resizeMode="contain" />
                  <Text style={styles.avatarLabel}>{avatar.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Upload Option */}
            <TouchableOpacity 
              onPress={handleUploadPhoto} 
              style={styles.uploadSection}
              disabled={uploading || generating}
            >
              <Ionicons 
                name={uploading || generating ? "hourglass-outline" : "cloud-upload-outline"} 
                size={20} 
                color="#6B7280" 
              />
              <Text style={styles.uploadText}>
                {uploading ? 'Uploading...' : generating ? 'Generating Avatar...' : 'Upload Photo'}
              </Text>
            </TouchableOpacity>
            
            {/* Generate Avatar Text */}
            <Text style={styles.generateText}>Generate AI Cartoon Avatar</Text>
            
            {/* Generated Avatar Display */}
            {generatedAvatar && (
              <View style={styles.generatedAvatarContainer}>
                <Text style={styles.generatedAvatarTitle}>Your Generated Avatar</Text>
                <TouchableOpacity
                  onPress={() => setSelectedAvatar('generated')}
                  style={[
                    styles.generatedAvatarOption,
                    selectedAvatar === 'generated' && styles.selectedGeneratedAvatar
                  ]}
                >
                  <Image 
                    source={{ uri: generatedAvatar }} 
                    style={styles.generatedAvatarImage} 
                    resizeMode="cover" 
                  />
                  <Text style={styles.generatedAvatarLabel}>Generated Avatar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          onPress={handleSaveProfile}
          disabled={!name || !age || !selectedAvatar || saving}
          style={[
            styles.saveButton,
            (!name || !age || !selectedAvatar || saving) && styles.disabledButton
          ]}
        >
          <LinearGradient
            colors={(!name || !age || !selectedAvatar || saving) ? ['#D1D5DB', '#9CA3AF'] : ['#0B5ED7', '#0B5ED7']}
            style={styles.saveButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[
              styles.saveButtonText,
              (!name || !age || !selectedAvatar || saving) && styles.disabledButtonText
            ]}>
              {saving ? 'Saving…' : 'Save My Profile'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  centeredTitleSection: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  avatarSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  activeCategoryTab: {
    borderColor: '#0B5ED7',
    shadowColor: '#0B5ED7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activeCategoryTabText: {
    color: '#0B5ED7',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  avatarOption: {
    width: (width - 100) / 3,
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedAvatarOption: {
    borderColor: '#0B5ED7',
    backgroundColor: '#F8F5FF',
    shadowColor: '#0B5ED7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: '65%',
    height: '65%',
    marginBottom: 6,
    borderRadius: 6,
  },
  avatarEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  avatarLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  uploadSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  generateText: {
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
    marginTop: 6,
  },
  platformNote: {
    fontSize: 11,
    color: '#059669',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  generatedAvatarContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  generatedAvatarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  generatedAvatarOption: {
    width: (width - 100) / 3,
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedGeneratedAvatar: {
    borderColor: '#0B5ED7',
    backgroundColor: '#F8F5FF',
    shadowColor: '#0B5ED7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  generatedAvatarImage: {
    width: '65%',
    height: '65%',
    marginBottom: 6,
    borderRadius: 6,
  },
  generatedAvatarLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 100,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  saveButton: {
    borderRadius: 12,
    shadowColor: '#0B5ED7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});