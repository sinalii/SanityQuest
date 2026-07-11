import { db } from '@/config/firebase';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface QuizQuestion {
  QuizNClean_question: string;
  QuizNClean_image: string;
  QuizNClean_options: Array<{
    id: string;
    icon: string;
    correct: boolean;
  }>;
  QuizNClean_category: string;
}

export default function EditQuiz() {
  const params = useLocalSearchParams();
  const questionId = params.id as string;
  
  const [question, setQuestion] = useState<QuizQuestion>({
    QuizNClean_question: '',
    QuizNClean_image: '',
    QuizNClean_options: [
      { id: '1', icon: '', correct: false },
      { id: '2', icon: '', correct: false }
    ],
    QuizNClean_category: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      setInitialLoading(true);
      const questionDoc = await getDoc(doc(db, 'QuizNClean', questionId));
      
      if (questionDoc.exists()) {
        const data = questionDoc.data();
        setQuestion({
          QuizNClean_question: data.QuizNClean_question || '',
          QuizNClean_image: data.QuizNClean_image || '',
          QuizNClean_options: data.QuizNClean_options || [
            { id: '1', icon: '', correct: false },
            { id: '2', icon: '', correct: false }
          ],
          QuizNClean_category: data.QuizNClean_category || '',
        });
      } else {
        Alert.alert('Error', 'Question not found');
        router.back();
      }
    } catch (error: any) {
      console.error('Error fetching question:', error);
      Alert.alert('Error', 'Failed to fetch question');
      router.back();
    } finally {
      setInitialLoading(false);
    }
  };

  const updateQuestion = (field: keyof QuizQuestion, value: any) => {
    setQuestion(prev => ({ ...prev, [field]: value }));
  };

  const updateOption = (optionIndex: number, field: string, value: any) => {
    const updated = [...question.QuizNClean_options];
    updated[optionIndex] = { ...updated[optionIndex], [field]: value };
    setQuestion(prev => ({ ...prev, QuizNClean_options: updated }));
  };

  const handleSave = async () => {
    if (!question.QuizNClean_question.trim()) {
      Alert.alert('Error', 'Please add question text');
      return;
    }

    if (!question.QuizNClean_image.trim()) {
      Alert.alert('Error', 'Please add question image URL');
      return;
    }

    if (!question.QuizNClean_category.trim()) {
      Alert.alert('Error', 'Please add category');
      return;
    }

    // Validate options
    for (let i = 0; i < question.QuizNClean_options.length; i++) {
      const option = question.QuizNClean_options[i];
      if (!option.icon.trim()) {
        Alert.alert('Error', `Please add image URL for option ${i + 1}`);
        return;
      }
    }

    // Check if at least one option is marked as correct
    const hasCorrectAnswer = question.QuizNClean_options.some(option => option.correct);
    if (!hasCorrectAnswer) {
      Alert.alert('Error', 'Please mark at least one option as correct');
      return;
    }

    try {
      setLoading(true);

      // Update question in QuizNClean collection
      await updateDoc(doc(db, 'QuizNClean', questionId), {
        QuizNClean_question: question.QuizNClean_question.trim(),
        QuizNClean_image: question.QuizNClean_image.trim(),
        QuizNClean_options: question.QuizNClean_options,
        QuizNClean_category: question.QuizNClean_category.trim(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Question updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating question:', error);
      Alert.alert('Error', error.message || 'Failed to update question');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Question</Text>
          <Text style={styles.subtitle}>Modify the quiz question</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Question Text</Text>
            <TextInput
              style={styles.input}
              value={question.QuizNClean_question}
              onChangeText={(value) => updateQuestion('QuizNClean_question', value)}
              placeholder="Enter the question text"
              placeholderTextColor="#9ca3af"
              multiline
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Question Image URL</Text>
            <TextInput
              style={styles.input}
              value={question.QuizNClean_image}
              onChangeText={(value) => updateQuestion('QuizNClean_image', value)}
              placeholder="Enter the main question image URL"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={question.QuizNClean_category}
              onChangeText={(value) => updateQuestion('QuizNClean_category', value)}
              placeholder="Enter category (e.g., water, hygiene)"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <Text style={styles.optionsTitle}>Answer Options (2 options)</Text>
          {question.QuizNClean_options.map((option, optionIndex) => (
            <View key={option.id} style={styles.optionContainer}>
              <Text style={styles.optionLabel}>Option {optionIndex + 1} Image URL</Text>
              <TextInput
                style={styles.optionInput}
                value={option.icon}
                onChangeText={(value) => updateOption(optionIndex, 'icon', value)}
                placeholder={`Enter image URL for option ${optionIndex + 1}`}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                style={[
                  styles.correctButton,
                  option.correct && styles.correctButtonSelected
                ]}
                onPress={() => updateOption(optionIndex, 'correct', !option.correct)}
              >
                <Text style={[
                  styles.correctButtonText,
                  option.correct && styles.correctButtonTextSelected
                ]}>
                  {option.correct ? '✓ Correct' : 'Mark as Correct'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <View
              style={[styles.saveButtonGradient, { backgroundColor: loading ? '#9ca3af' : '#3b82f6' }]}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
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
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 16,
  },
  optionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  optionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    color: '#1f2937',
  },
  correctButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  correctButtonSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  correctButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
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
