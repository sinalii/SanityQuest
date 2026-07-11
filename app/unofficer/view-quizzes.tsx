import { db } from '@/config/firebase';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Quiz image mapping
const getQuizImage = (imageName: string) => {
  const imageMap: { [key: string]: any } = {
    'sneez': require('@/assets/quiz/sneez.png'),
    'running_tap': require('@/assets/quiz/running_tap.png'),
    'garbagebag': require('@/assets/quiz/garbagebag.png'),
    'dirtyhands': require('@/assets/quiz/dirtyhands.png'),
    'plastic': require('@/assets/quiz/plastic.png'),
    'rotten_apple': require('@/assets/quiz/rotten_apple.png'),
    'sleep': require('@/assets/quiz/sleep.png'),
    'wound': require('@/assets/quiz/wound.png'),
    'cake': require('@/assets/quiz/cake.png'),
  };
  return imageMap[imageName] || null;
};

const { width, height } = Dimensions.get('window');

interface QuizQuestion {
  id: string;
  QuizNClean_question: string;
  QuizNClean_image: string;
  QuizNClean_options: Array<{
    id: string;
    icon: string;
    correct: boolean;
  }>;
  QuizNClean_category: string;
  QuizNClean_createdAt: any;
}

export default function ViewQuizzes() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      
      // Fetch the 8 main quiz questions from QuizNClean collection
      const questionsSnapshot = await getDocs(query(collection(db, 'QuizNClean'), orderBy('QuizNClean_createdAt', 'desc')));

      const questionsList: QuizQuestion[] = [];
      questionsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('Processing question:', doc.id, {
          question: data.QuizNClean_question,
          image: data.QuizNClean_image,
          category: data.QuizNClean_category,
          options: data.QuizNClean_options
        });
        questionsList.push({
          id: doc.id,
          QuizNClean_question: data.QuizNClean_question || '',
          QuizNClean_image: data.QuizNClean_image || '',
          QuizNClean_options: data.QuizNClean_options || [],
          QuizNClean_category: data.QuizNClean_category || '',
          QuizNClean_createdAt: data.QuizNClean_createdAt,
        });
      });

      console.log('Loaded questions:', questionsList);
      setQuestions(questionsList);
    } catch (error: any) {
      console.error('Error fetching quiz questions:', error);
      Alert.alert('Error', 'Failed to fetch quiz questions');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleEditQuiz = (quizId: string) => {
    if (quizId === 'main-quiz') {
      router.push('/unofficer/edit-main-quiz');
    } else {
      router.push(`/unofficer/edit-quiz?id=${quizId}`);
    }
  };

  const handleDeleteQuiz = (quizId: string, quizTopic: string) => {
    console.log('🗑️ Delete button clicked for:', { quizId, quizTopic });
    Alert.alert(
      'Delete Quiz',
      `Are you sure you want to delete "${quizTopic}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('🔄 Navigating to delete confirmation page...');
            // Navigate to delete confirmation
            router.push(`/unofficer/delete-quiz?id=${quizId}&topic=${encodeURIComponent(quizTopic)}`);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading quizzes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Main Quiz Questions</Text>
          <Text style={styles.subtitle}>Manage the 8 quiz questions</Text>
        </View>

        {/* Quiz Questions List */}
        <View style={styles.quizList}>
          {questions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No quiz questions found</Text>
              <Text style={styles.emptySubtext}>Add questions to the main quiz</Text>
            </View>
          ) : (
            questions.map((question, index) => (
              <View key={question.id} style={styles.quizCard}>
                <View style={styles.quizHeader}>
                  <Text style={styles.quizTitle}>Question {index + 1}</Text>
                  <Text style={styles.quizCategory}>
                    Category: {question.QuizNClean_category}
                  </Text>
                </View>

                {/* Main Question Image */}
                <View style={styles.imageContainer}>
                  {question.QuizNClean_image ? (
                    (() => {
                      const imageSource = getQuizImage(question.QuizNClean_image);
                      return imageSource ? (
                        <Image 
                          source={imageSource} 
                          style={styles.mainImage}
                          resizeMode="cover"
                          onLoad={() => console.log('Image loaded successfully:', question.QuizNClean_image)}
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Text style={styles.placeholderText}>Image not found: {question.QuizNClean_image}</Text>
                        </View>
                      );
                    })()
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.quizInfo}>
                  <Text style={styles.quizQuestionText}>
                    {question.QuizNClean_question}
                  </Text>
                  <Text style={styles.quizOptions}>
                    {question.QuizNClean_options.length} options
                  </Text>
                </View>

                <View style={styles.quizActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditQuiz(question.id)}
                  >
                    <View
                      style={[styles.actionButtonGradient, { backgroundColor: '#3b82f6' }]}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteQuiz(question.id, `Question ${index + 1}`)}
                  >
                    <View
                      style={[styles.actionButtonGradient, { backgroundColor: '#ef4444' }]}
                    >
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Create New Quiz Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/unofficer/create-quiz')}
        >
          <View
            style={[styles.createButtonGradient, { backgroundColor: '#10b981' }]}
          >
            <Text style={styles.createButtonText}>+ Create New Quiz</Text>
          </View>
        </TouchableOpacity>
             </ScrollView>
           </View>
         );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B8D4FD',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
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
    color: '#3B82F6',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#3B82F6',
  },
  quizList: {
    marginBottom: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#1E3A8A',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#3B82F6',
  },
  quizCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    marginVertical: 12,
    alignItems: 'center',
  },
  mainImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  imagePlaceholder: {
    width: 200,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  quizHeader: {
    marginBottom: 12,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  quizCategory: {
    fontSize: 14,
    color: '#3B82F6',
  },
  quizQuestionText: {
    fontSize: 16,
    color: '#1E3A8A',
    marginBottom: 8,
    lineHeight: 22,
  },
  quizOptions: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  quizInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quizQuestions: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  quizId: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  quizActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    borderRadius: 8,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 8,
  },
  actionButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  createButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

