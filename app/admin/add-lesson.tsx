import { db } from '@/config/firebase';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Quiz {
  question: string;
  answers: string[];
  correctAnswer: number;
}

export default function AddLesson() {
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Quiz states
  const [quizzes, setQuizzes] = useState<Quiz[]>([
    { question: '', answers: ['', '', ''], correctAnswer: 0 },
  ]);

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

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const uploadVideoToCloudinary = async (uri: string, lessonId: string) => {
    try {

      const CLOUD_NAME = 'Your Cloudinary Name Here';
      const UPLOAD_PRESET = 'UPLOAD_PRESET_HERE';

      // Get file extension and determine MIME type
      const fileExtension = uri.split('.').pop()?.toLowerCase() || 'mp4';
      const mimeType = `video/${fileExtension === 'mov' ? 'quicktime' : fileExtension}`;

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: mimeType,
        name: `lesson_${lessonId}.${fileExtension}`,
      } as any);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('public_id', `lesson_${lessonId}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        return data.secure_url; // Return the Cloudinary URL
      } else {
        console.error('Cloudinary upload error:', data);
        Alert.alert('Upload Failed', `Failed to upload video: ${data.error?.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.error('Error uploading video to Cloudinary:', error);
      Alert.alert('Upload Error', 'An error occurred while uploading the video.');
      return null;
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonTopic.trim() || !lessonContent.trim()) {
      Alert.alert('Error', 'Please fill in lesson topic and content');
      return;
    }

    // Validate quizzes if any question is filled
    const hasAnyQuizData = quizzes.some(q => 
      q.question.trim() || q.answers.some(a => a.trim())
    );

    if (hasAnyQuizData) {
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
    }

    try {
      setLoading(true);

      // Create lesson document in Firestore
      const lessonData: any = {
        topic: lessonTopic.trim(),
        content: lessonContent.trim(),
        videoUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const lessonRef = await addDoc(collection(db, 'lessons'), lessonData);
      const lessonId = lessonRef.id;

      
      if (videoUri) {
        const cloudinaryUrl = await uploadVideoToCloudinary(videoUri, lessonId);
        if (cloudinaryUrl) {
          await updateDoc(doc(db, 'lessons', lessonId), {
            videoUrl: cloudinaryUrl,
          });
        }
      }

      // Save quiz with lessonId if quiz data exists
      if (hasAnyQuizData) {
        await addDoc(collection(db, 'quizzes'), {
          lessonId: lessonId,
          topic: lessonTopic.trim(),
          quizzes: quizzes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      Alert.alert('Success', 'Lesson and quiz created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      Alert.alert('Error', error.message || 'Failed to create lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#d7e9ff", "#cfe6ff"]}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add New Lesson</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Lesson Topic</Text>
            <TextInput
              style={styles.input}
              value={lessonTopic}
              onChangeText={setLessonTopic}
              placeholder="Add Lesson Topic"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Lesson</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={lessonContent}
              onChangeText={setLessonContent}
              placeholder="Add Lesson"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Upload Lesson Video</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
              <Text style={styles.uploadButtonText}>🎥 Upload Video</Text>
            </TouchableOpacity>
            {videoUri && (
              <View style={styles.videoPreview}>
                <Video
                  source={{ uri: videoUri }}
                  style={styles.previewVideo}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                />
                <TouchableOpacity
                  style={styles.removeVideoButton}
                  onPress={() => setVideoUri(null)}
                >
                  <Text style={styles.removeVideoText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Quiz Section */}
          <View style={styles.quizSection}>
            <Text style={styles.sectionTitle}>Create Lesson Quiz</Text>
            
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
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateLesson}
            disabled={loading}
          >
            <LinearGradient
              colors={['#0052cc', '#0052cc']}
              style={styles.createButtonGradient}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Creating...' : 'Complete'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
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
    color: '#666',
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
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0052cc',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#0052cc',
    fontWeight: '600',
  },
  videoPreview: {
    marginTop: 12,
    position: 'relative',
  },
  previewVideo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  removeVideoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeVideoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0052cc',
    marginBottom: 16,
  },
  quizCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 2,
    borderColor: '#0052cc',
    marginBottom: 16,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0052cc',
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
    borderColor: '#0052cc',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addQuizButtonText: {
    fontSize: 16,
    color: '#0052cc',
    fontWeight: 'bold',
  },
  createQuizButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 10,
  },
  createQuizGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createQuizText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 10,
    marginBottom: 30,
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
