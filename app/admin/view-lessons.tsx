import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { db } from '@/config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system/legacy';

interface Lesson {
  id: string;
  topic: string;
  content: string;
  videoUrl: string | null;
  createdAt: any;
}

export default function ViewLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const lessonsQuery = query(collection(db, 'lessons'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(lessonsQuery);
      
      const fetchedLessons: Lesson[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLessons.push({
          id: doc.id,
          ...doc.data(),
        } as Lesson);
      });

      setLessons(fetchedLessons);
    } catch (error: any) {
      console.error('Error fetching lessons:', error);
      Alert.alert('Error', 'Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  };

  const renderLesson = ({ item }: { item: Lesson }) => (
    <View style={styles.lessonCard}>
      <View style={styles.cardContent}>
        <Text style={styles.lessonTopic}>{item.topic}</Text>
        <Text style={styles.lessonContent} numberOfLines={3}>
          {item.content}
        </Text>
        {item.videoUrl && (
          <Video
            source={{ uri: item.videoUrl }}
            style={styles.lessonVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
          />
        )}
        <Text style={styles.lessonDate}>
          {item.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
        </Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
     colors={["#d7e9ff", "#cfe6ff"]}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Lessons</Text>
        <Text style={styles.subtitle}>Total: {lessons.length} lessons</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading lessons...</Text>
        </View>
      ) : lessons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📚</Text>
          <Text style={styles.emptyTitle}>No Lessons Yet</Text>
          <Text style={styles.emptySubtitle}>Create your first lesson to get started</Text>
        </View>
      ) : (
        <FlatList
          data={lessons}
          renderItem={renderLesson}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0052cc',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0052cc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  lessonCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cardContent: {
    padding: 16,
  },
  lessonTopic: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  lessonContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  lessonVideo: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#000',
  },
  lessonDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
