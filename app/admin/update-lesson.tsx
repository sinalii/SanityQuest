import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Video, ResizeMode } from 'expo-av';
import { db } from '@/config/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp, where, addDoc, deleteDoc } from 'firebase/firestore';

interface Lesson {
  id: string;
  topic: string;
  content: string;
  videoUrl: string | null;
}

interface Quiz {
  question: string;
  answers: string[];
  correctAnswer: number;
}

interface QuizData {
  id: string;
  lessonId: string;
  topic: string;
  quizzes: Quiz[];
}

export default function UpdateLesson() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  
  // Quiz states
  const [existingQuizId, setExistingQuizId] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([
    { question: '', answers: ['', '', ''], correctAnswer: 0 },
  ]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

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

  const fetchQuizForLesson = async (lessonId: string) => {
    try {
      setLoadingQuiz(true);
      const quizzesQuery = query(
        collection(db, 'quizzes'),
        where('lessonId', '==', lessonId)
      );
      const querySnapshot = await getDocs(quizzesQuery);
      
      if (!querySnapshot.empty) {
        const quizDoc = querySnapshot.docs[0];
        const quizData = quizDoc.data() as QuizData;
        setExistingQuizId(quizDoc.id);
        setQuizzes(quizData.quizzes || [{ question: '', answers: ['', '', ''], correctAnswer: 0 }]);
      } else {
        // No quiz exists, reset to default
        setExistingQuizId(null);
        setQuizzes([{ question: '', answers: ['', '', ''], correctAnswer: 0 }]);
      }
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      setExistingQuizId(null);
      setQuizzes([{ question: '', answers: ['', '', ''], correctAnswer: 0 }]);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const selectLesson = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLessonTopic(lesson.topic);
    setLessonContent(lesson.content);
    setVideoUri(lesson.videoUrl);
    
    // Fetch associated quiz
    await fetchQuizForLesson(lesson.id);
  };

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

  const saveVideoLocally = async (uri: string, lessonId: string) => {
    try {
      const fileExtension = uri.split('.').pop();
      const fileName = `lesson_${lessonId}.${fileExtension}`;
      const directory = `${FileSystem.documentDirectory ?? ''}lessons/`;
      
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }

      const localUri = `${directory}${fileName}`;
      await FileSystem.copyAsync({
        from: uri,
        to: localUri,
      });

      return localUri;
    } catch (error) {
      console.error('Error saving image locally:', error);
      return null;
    }
  };

  const handleUpdate = async () => {
    if (!selectedLesson) {
      Alert.alert('Error', 'Please select a lesson to update');
      return;
    }

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
      setUpdating(true);

      // Update lesson
      let finalVideoUri = videoUri;
      
      // If video changed and is a new local URI (not from filesystem)
      if (videoUri && !videoUri.startsWith(FileSystem.documentDirectory ?? '')) {
        const localPath = await saveVideoLocally(videoUri, selectedLesson.id);
        if (localPath) {
          finalVideoUri = localPath;
        }
      }

      await updateDoc(doc(db, 'lessons', selectedLesson.id), {
        topic: lessonTopic.trim(),
        content: lessonContent.trim(),
        videoUrl: finalVideoUri,
        updatedAt: serverTimestamp(),
      });

      // Handle quiz update/create/delete
      if (hasAnyQuizData) {
        const quizData = {
          lessonId: selectedLesson.id,
          topic: lessonTopic.trim(),
          quizzes: quizzes,
          updatedAt: serverTimestamp(),
        };

        if (existingQuizId) {
          // Update existing quiz
          await updateDoc(doc(db, 'quizzes', existingQuizId), quizData);
        } else {
          // Create new quiz
          await addDoc(collection(db, 'quizzes'), {
            ...quizData,
            createdAt: serverTimestamp(),
          });
        }
      } else if (existingQuizId) {
        // No quiz data but quiz exists - delete it
        await deleteDoc(doc(db, 'quizzes', existingQuizId));
      }

      Alert.alert('Success', 'Lesson and quiz updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setSelectedLesson(null);
            setLessonTopic('');
            setLessonContent('');
            setVideoUri(null);
            setQuizzes([{ question: '', answers: ['', '', ''], correctAnswer: 0 }]);
            setExistingQuizId(null);
            fetchLessons();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error updating lesson:', error);
      Alert.alert('Error', error.message || 'Failed to update lesson');
    } finally {
      setUpdating(false);
    }
  };

  const renderLesson = ({ item }: { item: Lesson }) => (
    <TouchableOpacity
      style={[
        styles.lessonCard,
        selectedLesson?.id === item.id && styles.selectedCard,
      ]}
      onPress={() => selectLesson(item)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.lessonTopic}>{item.topic}</Text>
        <Text style={styles.lessonContent} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
      {selectedLesson?.id === item.id && (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (!selectedLesson) {
    return (
      <LinearGradient
        colors={["#d7e9ff", "#cfe6ff"]}
        style={styles.container}
      >
        <StatusBar style="dark" />
        <View style={[styles.header, { padding: 20 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Update Lesson</Text>
          <Text style={styles.subtitle}>Select a lesson to update</Text>
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

  return (
    <LinearGradient
      colors={["#d7e9ff", "#cfe6ff"]}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setSelectedLesson(null);
              setQuizzes([{ question: '', answers: ['', '', ''], correctAnswer: 0 }]);
              setExistingQuizId(null);
            }}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back to List</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Update Lesson</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Lesson Topic</Text>
            <TextInput
              style={styles.input}
              value={lessonTopic}
              onChangeText={setLessonTopic}
              placeholder="Update Lesson Topic"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Lesson</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={lessonContent}
              onChangeText={setLessonContent}
              placeholder="Update Lesson"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Lesson Video</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
              <Text style={styles.uploadButtonText}>🎥 Change Video</Text>
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
            <Text style={styles.sectionTitle}>
              {existingQuizId ? 'Update Lesson Quiz' : 'Add Lesson Quiz'}
            </Text>
            
            {loadingQuiz ? (
              <View style={styles.loadingQuizContainer}>
                <ActivityIndicator size="small" color="#8b5cf6" />
                <Text style={styles.loadingQuizText}>Loading quiz...</Text>
              </View>
            ) : (
              <>
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
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdate}
            disabled={updating}
          >
            <LinearGradient
              colors={['#8b5cf6', '#a78bfa']}
              style={styles.updateButtonGradient}
            >
              <Text style={styles.updateButtonText}>
                {updating ? 'Updating...' : 'Update Lesson & Quiz'}
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
    paddingTop: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
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
    color: '#666',
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f3f0ff',
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
  selectedBadge: {
    backgroundColor: '#8b5cf6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  uploadButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8b5cf6',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#8b5cf6',
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
    color: '#1f2937',
    marginBottom: 16,
  },
  loadingQuizContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingQuizText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  quizCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 2,
    borderColor: '#8b5cf6',
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
    marginBottom: 16,
  },
  addQuizButtonText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: 'bold',
  },
  updateButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 10,
  },
  updateButtonGradient: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
