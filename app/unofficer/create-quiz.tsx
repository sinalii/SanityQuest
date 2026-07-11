import { db } from '@/config/firebase';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Available quiz images mapping
const availableImages = [
  'sneez', 'running_tap', 'garbagebag', 'dirtyhands', 'plastic', 
  'rotten_apple', 'sleep', 'wound', 'cake', 'water', 'soap', 'brush'
];

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

export default function CreateQuiz() {
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

  const updateQuestion = (field: keyof QuizQuestion, value: any) => {
    setQuestion(prev => ({ ...prev, [field]: value }));
  };

  const updateOption = (optionIndex: number, field: string, value: any) => {
    const updated = [...question.QuizNClean_options];
    updated[optionIndex] = { ...updated[optionIndex], [field]: value };
    setQuestion(prev => ({ ...prev, QuizNClean_options: updated }));
  };

  const handleCreate = async () => {
    console.log('🔍 Creating quiz question with data:', question);
    console.log('📋 Options array:', question.QuizNClean_options);
    
    if (!question.QuizNClean_question.trim()) {
      console.log('❌ Validation failed: No question text');
      Alert.alert('Error', 'Please add question text');
      return;
    }

    if (!question.QuizNClean_image.trim()) {
      console.log('❌ Validation failed: No question image');
      Alert.alert('Error', 'Please add question image name');
      return;
    }

    if (!question.QuizNClean_category.trim()) {
      console.log('❌ Validation failed: No category');
      Alert.alert('Error', 'Please add category');
      return;
    }

    // Validate options
    console.log('🔍 Validating options...');
    for (let i = 0; i < question.QuizNClean_options.length; i++) {
      const option = question.QuizNClean_options[i];
      console.log(`🔍 Option ${i + 1}:`, option);
      if (!option.icon.trim()) {
        console.log(`❌ Validation failed: No image for option ${i + 1}`);
        Alert.alert('Error', `Please add image name for option ${i + 1}`);
        return;
      }
    }

    // Check if at least one option is marked as correct
    const hasCorrectAnswer = question.QuizNClean_options.some(option => option.correct);
    console.log('🔍 Has correct answer:', hasCorrectAnswer);
    if (!hasCorrectAnswer) {
      console.log('❌ Validation failed: No correct answer marked');
      Alert.alert('Error', 'Please mark at least one option as correct');
      return;
    }

    console.log('✅ All validations passed, proceeding to Firebase...');

    try {
      setLoading(true);
      console.log('📝 Adding question to Firebase...');
      console.log('📊 Question data being sent:', {
        QuizNClean_question: question.QuizNClean_question.trim(),
        QuizNClean_image: question.QuizNClean_image.trim(),
        QuizNClean_options: question.QuizNClean_options,
        QuizNClean_category: question.QuizNClean_category.trim(),
      });

      // Add question to QuizNClean collection
      const docRef = await addDoc(collection(db, 'QuizNClean'), {
        QuizNClean_question: question.QuizNClean_question.trim(),
        QuizNClean_image: question.QuizNClean_image.trim(),
        QuizNClean_options: question.QuizNClean_options,
        QuizNClean_category: question.QuizNClean_category.trim(),
        QuizNClean_createdAt: serverTimestamp(),
      });

      console.log('✅ Question added successfully with ID:', docRef.id);
      console.log('🎉 Document reference:', docRef);

      Alert.alert('Success', 'Quiz question added successfully!', [
        {
          text: 'OK',
          onPress: () => {
            console.log('🔄 Navigating back to view quizzes...');
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('❌ Error creating quiz question:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      Alert.alert('Error', error.message || 'Failed to create quiz question');
    } finally {
      setLoading(false);
      console.log('🏁 Loading state set to false');
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
          <Text style={styles.title}>Add New Question</Text>
          <Text style={styles.subtitle}>Add a question to the main quiz</Text>
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
            <Text style={styles.label}>Question Image</Text>
            <Text style={styles.helperText}>Available images: {availableImages.join(', ')}</Text>
            <TextInput
              style={styles.input}
              value={question.QuizNClean_image}
              onChangeText={(value) => updateQuestion('QuizNClean_image', value)}
              placeholder="Enter image name (e.g., cake, water, soap)"
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
              <Text style={styles.optionLabel}>Option {optionIndex + 1} Image</Text>
              <Text style={styles.helperText}>Available images: {availableImages.join(', ')}</Text>
              <TextInput
                style={styles.optionInput}
                value={option.icon}
                onChangeText={(value) => updateOption(optionIndex, 'icon', value)}
                placeholder={`Enter image name (e.g., cake, water, soap)`}
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
            style={styles.createButton}
            onPress={handleCreate}
            disabled={loading}
          >
            <View
              style={[styles.createButtonGradient, { backgroundColor: loading ? '#9ca3af' : '#10b981' }]}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Creating...' : 'Add Question'}
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
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontStyle: 'italic',
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
    color: '#1E3A8A',
    marginTop: 20,
    marginBottom: 16,
  },
  optionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
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
  createButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 20,
  },
  createButtonGradient: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
