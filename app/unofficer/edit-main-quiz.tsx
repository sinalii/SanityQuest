import { db } from '@/config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { collection, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface QuizQuestion {
  id: string;
  QuizNClean_question: string;
  QuizNClean_options: Array<{
    id: string;
    text: string;
    correct: boolean;
  }>;
  QuizNClean_category: string;
  QuizNClean_image: string;
}

export default function EditMainQuiz() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setInitialLoading(true);
      const questionsSnapshot = await getDocs(collection(db, 'QuizNClean'));
      
      const questionsList: QuizQuestion[] = [];
      questionsSnapshot.forEach(doc => {
        const data = doc.data();
        questionsList.push({
          id: doc.id,
          QuizNClean_question: data.QuizNClean_question || '',
          QuizNClean_options: data.QuizNClean_options || [],
          QuizNClean_category: data.QuizNClean_category || '',
          QuizNClean_image: data.QuizNClean_image || '',
        });
      });
      
      setQuestions(questionsList);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      Alert.alert('Error', 'Failed to fetch quiz questions');
    } finally {
      setInitialLoading(false);
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    const updated = [...questions];
    updated[questionIndex].QuizNClean_options[optionIndex] = {
      ...updated[questionIndex].QuizNClean_options[optionIndex],
      [field]: value
    };
    setQuestions(updated);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Update each question
      for (const question of questions) {
        await updateDoc(doc(db, 'QuizNClean', question.id), {
          QuizNClean_question: question.QuizNClean_question,
          QuizNClean_options: question.QuizNClean_options,
          QuizNClean_category: question.QuizNClean_category,
          updatedAt: serverTimestamp(),
        });
      }
      
      Alert.alert('Success', 'Main quiz updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating main quiz:', error);
      Alert.alert('Error', error.message || 'Failed to update main quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (initialLoading) {
    return (
      <LinearGradient
        colors={['#1e3a8a', '#3b82f6']}
        style={styles.container}
      >
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading main quiz...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
      style={styles.container}
    >
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Main Quiz</Text>
          <Text style={styles.subtitle}>Modify the main hygiene quiz questions</Text>
        </View>

        {questions.map((question, questionIndex) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionTitle}>Question {questionIndex + 1}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Question Text</Text>
              <TextInput
                style={styles.input}
                value={question.QuizNClean_question}
                onChangeText={(value) => updateQuestion(questionIndex, 'QuizNClean_question', value)}
                placeholder="Enter question text"
                placeholderTextColor="#9ca3af"
                multiline
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={question.QuizNClean_category}
                onChangeText={(value) => updateQuestion(questionIndex, 'QuizNClean_category', value)}
                placeholder="Enter category"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <Text style={styles.optionsTitle}>Answer Options</Text>
            {question.QuizNClean_options.map((option, optionIndex) => (
              <View key={optionIndex} style={styles.optionContainer}>
                <TextInput
                  style={styles.optionInput}
                  value={option.text}
                  onChangeText={(value) => updateOption(questionIndex, optionIndex, 'text', value)}
                  placeholder={`Option ${optionIndex + 1}`}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  style={[
                    styles.correctButton,
                    option.correct && styles.correctButtonSelected
                  ]}
                  onPress={() => updateOption(questionIndex, optionIndex, 'correct', !option.correct)}
                >
                  <Text style={[
                    styles.correctButtonText,
                    option.correct && styles.correctButtonTextSelected
                  ]}>
                    {option.correct ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#9ca3af', '#6b7280'] : ['#10b981', '#34d399']}
            style={styles.saveButtonGradient}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    color: '#1f2937',
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    marginTop: 8,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 12,
    color: '#1f2937',
  },
  correctButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  correctButtonSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  correctButtonText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'bold',
  },
  correctButtonTextSelected: {
    color: 'white',
  },
  saveButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 20,
  },
  saveButtonGradient: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
