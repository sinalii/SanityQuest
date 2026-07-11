import { db } from '@/config/firebase';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DeleteQuiz() {
  const params = useLocalSearchParams();
  const questionId = params.id as string;
  const questionTitle = params.topic as string;
  
  console.log('🗑️ DeleteQuiz page loaded with params:', { questionId, questionTitle });
  
  const [loading, setLoading] = useState(false);
  const [questionData, setQuestionData] = useState<any>(null);

  useEffect(() => {
    if (questionId) {
      console.log('🔍 Fetching question data for ID:', questionId);
      fetchQuestionData();
    } else {
      console.log('❌ No questionId provided');
    }
  }, [questionId]);

  const fetchQuestionData = async () => {
    try {
      const questionDoc = await getDoc(doc(db, 'QuizNClean', questionId));
      if (questionDoc.exists()) {
        setQuestionData(questionDoc.data());
      }
    } catch (error: any) {
      console.error('Error fetching question data:', error);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to permanently delete "${questionTitle || 'this question'}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete,
        },
      ]
    );
  };

  const performDelete = async () => {
    try {
      setLoading(true);
      
      await deleteDoc(doc(db, 'QuizNClean', questionId));
      
      Alert.alert('Success', 'Question deleted successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/unofficer/dashboard'),
        },
      ]);
    } catch (error: any) {
      console.error('Error deleting question:', error);
      Alert.alert('Error', error.message || 'Failed to delete question');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Delete Question</Text>
          <Text style={styles.subtitle}>Remove question from main quiz</Text>
        </View>

        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningTitle}>Warning</Text>
          <Text style={styles.warningText}>
            This action will permanently delete the question and all its data. This cannot be undone.
          </Text>
        </View>

        {questionData && (
          <View style={styles.questionInfo}>
            <Text style={styles.questionInfoTitle}>Question Details</Text>
            <View style={styles.questionInfoItem}>
              <Text style={styles.questionInfoLabel}>Question:</Text>
              <Text style={styles.questionInfoValue}>{questionData.QuizNClean_question}</Text>
            </View>
            <View style={styles.questionInfoItem}>
              <Text style={styles.questionInfoLabel}>Category:</Text>
              <Text style={styles.questionInfoValue}>{questionData.QuizNClean_category}</Text>
            </View>
            <View style={styles.questionInfoItem}>
              <Text style={styles.questionInfoLabel}>Options:</Text>
              <Text style={styles.questionInfoValue}>{questionData.QuizNClean_options?.length || 0}</Text>
            </View>
            <View style={styles.questionInfoItem}>
              <Text style={styles.questionInfoLabel}>Created:</Text>
              <Text style={styles.questionInfoValue}>
                {questionData.QuizNClean_createdAt?.toDate ? 
                  questionData.QuizNClean_createdAt.toDate().toLocaleDateString() : 
                  'Unknown'
                }
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleBack}
            disabled={loading}
          >
            <View
              style={[styles.cancelButtonGradient, { backgroundColor: '#6b7280' }]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={loading}
          >
            <View
              style={[styles.deleteButtonGradient, { backgroundColor: loading ? '#9ca3af' : '#ef4444' }]}
            >
              <Text style={styles.deleteButtonText}>
                {loading ? 'Deleting...' : 'Delete Question'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
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
  warningContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 16,
    color: '#1E3A8A',
    textAlign: 'center',
    lineHeight: 24,
  },
  questionInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  questionInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  questionInfoItem: {
    marginBottom: 8,
  },
  questionInfoLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 4,
  },
  questionInfoValue: {
    fontSize: 16,
    color: 'white',
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cancelButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  deleteButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});