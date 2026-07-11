import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '@/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface Quiz {
  question: string;
  answers: string[];
  correctAnswer: number;
}

export default function CreateQuiz() {
  const params = useLocalSearchParams();
  const lessonTopic = params.lessonTopic as string || '';

  const [quizTopic, setQuizTopic] = useState(lessonTopic);
  const [quizzes, setQuizzes] = useState<Quiz[]>([
    { question: '', answers: ['', '', ''], correctAnswer: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  const addQuiz = () => {
    setQuizzes([...quizzes, { question: '', answers: ['', '', ''], correctAnswer: 0 }]);
  };

  const updateQuiz = (index: number, field: keyof Quiz, value: any) => {
    const updated = [...quizzes];
    updated[index] = { ...updated[index], [field]: value };
    setQuizzes(updated);
  };

  const updateAnswer = (quizIndex: number, answerIndex: number, value: string) => {
    const updated = [...quizzes];
    updated[quizIndex].answers[answerIndex] = value;
    setQuizzes(updated);
  };

  const removeQuiz = (index: number) => {
    if (quizzes.length > 1) {
      setQuizzes(quizzes.filter((_, i) => i !== index));
    }
  };

  const handleComplete = async () => {
    if (!quizTopic.trim()) {
      Alert.alert('Error', 'Please add quiz topic');
      return;
    }

    // Validate all quizzes
    for (let i = 0; i < quizzes.length; i++) {
      const quiz = quizzes[i];
      if (!quiz.question.trim()) {
        Alert.alert('Error', `Please add question for Quiz ${i + 1}`);
        return;
      }
      for (let j = 0; j < quiz.answers.length; j++) {
        if (!quiz.answers[j].trim()) {
          Alert.alert('Error', `Please fill all answers for Quiz ${i + 1}`);
          return;
        }
      }
    }

    try {
      setLoading(true);

      // Save quiz to Firestore
      await addDoc(collection(db, 'quizzes'), {
        topic: quizTopic.trim(),
        quizzes: quizzes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Quiz created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      Alert.alert('Error', error.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#a78bfa', '#c4b5fd', '#e9d5ff']}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Lesson Quiz</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Quiz Topic</Text>
            <TextInput
              style={styles.input}
              value={quizTopic}
              onChangeText={setQuizTopic}
              placeholder="Add quiz Topic"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {quizzes.map((quiz, quizIndex) => (
            <View key={quizIndex} style={styles.quizCard}>
              <View style={styles.quizHeader}>
                <Text style={styles.quizTitle}>Quiz {quizIndex + 1}</Text>
                {quizzes.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeQuiz(quizIndex)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Question {quizIndex + 1}</Text>
                <TextInput
                  style={styles.input}
                  value={quiz.question}
                  onChangeText={(value) => updateQuiz(quizIndex, 'question', value)}
                  placeholder={`Question ${quizIndex + 1}`}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {quiz.answers.map((answer, answerIndex) => (
                <View key={answerIndex} style={styles.inputContainer}>
                  <Text style={styles.label}>Answer {answerIndex + 1}</Text>
                  <TextInput
                    style={styles.input}
                    value={answer}
                    onChangeText={(value) => updateAnswer(quizIndex, answerIndex, value)}
                    placeholder={`Answer ${answerIndex + 1}`}
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity
                    style={[
                      styles.correctAnswerButton,
                      quiz.correctAnswer === answerIndex && styles.correctAnswerSelected,
                    ]}
                    onPress={() => updateQuiz(quizIndex, 'correctAnswer', answerIndex)}
                  >
                    <Text
                      style={[
                        styles.correctAnswerText,
                        quiz.correctAnswer === answerIndex && styles.correctAnswerTextSelected,
                      ]}
                    >
                      {quiz.correctAnswer === answerIndex ? '✓ Correct Answer' : 'Mark as Correct'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}

          <TouchableOpacity style={styles.addQuizButton} onPress={addQuiz}>
            <Text style={styles.addQuizButtonText}>+ Add Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            disabled={loading}
          >
            <LinearGradient
              colors={['#10b981', '#34d399']}
              style={styles.completeButtonGradient}
            >
              <Text style={styles.completeButtonText}>
                {loading ? 'Saving...' : 'Complete'}
              </Text>
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
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4c1d95',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quizCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4c1d95',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  correctAnswerButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  correctAnswerSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  correctAnswerText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  correctAnswerTextSelected: {
    color: 'white',
  },
  addQuizButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8b5cf6',
    borderStyle: 'dashed',
  },
  addQuizButtonText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: 'bold',
  },
  completeButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 10,
  },
  completeButtonGradient: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
