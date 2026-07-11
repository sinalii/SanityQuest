import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LessonManagement() {
  const handleAddLesson = () => {
    router.push('/admin/add-lesson');
  };

  const handleUpdateLesson = () => {
    router.push('/admin/update-lesson');
  };

  const handleDeleteLesson = () => {
    router.push('/admin/delete-lesson');
  };

  const handleViewAllLessons = () => {
    router.push('/admin/view-lessons');
  };

  const handleBack = () => {
    router.back();
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
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Lesson Management</Text>
          <Text style={styles.subtitle}>Manage educational content</Text>
        </View>

        {/* Management Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={handleAddLesson}>
            <LinearGradient
              colors={['#8b5cf6', '#a78bfa']}
              style={styles.optionButtonGradient}
            >
              <Text style={styles.optionButtonText}>Add New Lesson</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton} onPress={handleUpdateLesson}>
            <LinearGradient
              colors={['#3b82f6', '#60a5fa']}
              style={styles.optionButtonGradient}
            >
              <Text style={styles.optionButtonText}>Update Lesson</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton} onPress={handleDeleteLesson}>
            <LinearGradient
              colors={['#ef4444', '#f87171']}
              style={styles.optionButtonGradient}
            >
              <Text style={styles.optionButtonText}>Delete Lesson</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton} onPress={handleViewAllLessons}>
            <LinearGradient
              colors={['#10b981', '#34d399']}
              style={styles.optionButtonGradient}
            >
              <Text style={styles.optionButtonText}>View All Lessons</Text>
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
    paddingTop: 50,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#0052cc',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0052cc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionButtonGradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  optionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
