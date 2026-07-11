import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '@/config/firebase';
import { collection, getDocs, query, orderBy, doc, deleteDoc, where } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system/legacy';

interface Lesson {
  id: string;
  topic: string;
  content: string;
  imageUrl: string | null;
}

export default function DeleteLesson() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const lessonsQuery = query(collection(db, 'lessons'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(lessonsQuery);
      
      const fetchedLessons: Lesson[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedLessons.push({
          id: docSnap.id,
          ...docSnap.data(),
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

  const deleteLocalImage = async (imageUrl: string) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUrl);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(imageUrl);
      }
    } catch (error) {
      console.error('Error deleting local image:', error);
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    Alert.alert(
      'Delete Lesson',
      `Are you sure you want to delete "${lesson.topic}"? This will also delete associated quizzes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(lesson.id);

              // Delete from Firestore
              await deleteDoc(doc(db, 'lessons', lesson.id));

              // Delete local image if exists
              if (lesson.imageUrl) {
                await deleteLocalImage(lesson.imageUrl);
              }

              // Delete associated quizzes
              const quizzesQuery = query(
                collection(db, 'quizzes'),
                where('lessonId', '==', lesson.id)
              );
              const quizzesSnapshot = await getDocs(quizzesQuery);
              const deletePromises = quizzesSnapshot.docs.map((docSnap) =>
                deleteDoc(doc(db, 'quizzes', docSnap.id))
              );
              await Promise.all(deletePromises);

              // Update local state
              setLessons(lessons.filter(l => l.id !== lesson.id));
              Alert.alert('Success', 'Lesson and associated quizzes deleted successfully');
            } catch (error: any) {
              console.error('Error deleting lesson:', error);
              Alert.alert('Error', 'Failed to delete lesson');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const renderLesson = ({ item }: { item: Lesson }) => (
    <View style={styles.lessonCard}>
      <View style={styles.cardContent}>
        <Text style={styles.lessonTopic}>{item.topic}</Text>
        <Text style={styles.lessonContent} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.deleteButton,
          deleting === item.id && styles.deleteButtonDisabled,
        ]}
        onPress={() => handleDelete(item)}
        disabled={deleting === item.id}
      >
        {deleting === item.id ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete</Text>
        )}
      </TouchableOpacity>
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
        <Text style={styles.title}>Delete Lesson</Text>
        <Text style={styles.subtitle}>Select a lesson to delete</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading lessons...</Text>
        </View>
      ) : lessons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📚</Text>
          <Text style={styles.emptyTitle}>No Lessons Available</Text>
          <Text style={styles.emptySubtitle}>Create lessons first to manage them</Text>
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
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  lessonTopic: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  lessonContent: {
    fontSize: 14,
    color: '#6b7280',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
