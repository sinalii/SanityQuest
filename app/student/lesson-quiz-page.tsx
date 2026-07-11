import { auth, db } from '@/config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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

export default function LessonQuiz() {
  const { lessonId } = useLocalSearchParams();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (lessonId) {
      fetchQuiz();
    }
  }, [lessonId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const quizzesQuery = query(
        collection(db, 'quizzes'),
        where('lessonId', '==', lessonId)
      );
      const querySnapshot = await getDocs(quizzesQuery);
      
      if (!querySnapshot.empty) {
        const quizDoc = querySnapshot.docs[0];
        const data = {
          id: quizDoc.id,
          ...quizDoc.data(),
        } as QuizData;
        
        setQuizData(data);
        setSelectedAnswers(new Array(data.quizzes.length).fill(-1));
      } else {
        Alert.alert('No Quiz', 'No quiz available for this lesson');
        router.back();
      }
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      Alert.alert('Error', 'Failed to load quiz');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (selectedAnswers[currentQuestionIndex] === -1) {
      Alert.alert('Select an Answer', 'Please select an answer before continuing');
      return;
    }

    if (currentQuestionIndex < (quizData?.quizzes.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    if (!quizData) return 0;
    
    let correct = 0;
    quizData.quizzes.forEach((quiz, index) => {
      if (selectedAnswers[index] === quiz.correctAnswer) {
        correct++;
      }
    });
    
    return Math.round((correct / quizData.quizzes.length) * 100);
  };

  const saveScore = async (finalScore: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const scoreData = {
        userId: user.uid,
        lessonId: lessonId as string,
        score: finalScore,
        totalQuestions: quizData?.quizzes.length || 0,
        correctAnswers: selectedAnswers.filter((ans, idx) => 
          ans === quizData?.quizzes[idx].correctAnswer
        ).length,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Create unique document ID based on userId and lessonId
      const scoreDocId = `${user.uid}_${lessonId}`;
      
      await setDoc(doc(db, 'lessonScores', scoreDocId), scoreData, { merge: true });
    } catch (error: any) {
      console.error('Error saving score:', error);
    }
  };

  const handleCompleteQuiz = async () => {
    if (selectedAnswers.some(ans => ans === -1)) {
      Alert.alert('Incomplete', 'Please answer all questions before completing the quiz');
      return;
    }

    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);
    
    await saveScore(finalScore);
  };

  const handleBackToLesson = () => {
    router.back();
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(quizData?.quizzes.length || 0).fill(-1));
    setShowResults(false);
    setScore(0);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Image
          source={require('../../assets/game/cloudySky.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0052cc" />
          <Text style={styles.loadingText}>🧠 Loading Quiz...</Text>
        </View>
      </View>
    );
  }

  if (!quizData) {
    return null;
  }

  // Results Screen
  if (showResults) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Image
          source={require('../../assets/game/cloudySky.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.resultsContainer}>
          <View style={styles.resultsCard}>
            <View style={styles.medalContainer}>
              <Image
                source={require('../../assets/game/medle.png')}
                style={styles.medalImage}
              />
            </View>
            
            <Text style={styles.resultsTitle}>🎉 Great Job!</Text>
            <Text style={styles.resultsSubtitle}>Lesson Completed!</Text>
            
            <View style={styles.scoreContainer}>
              <View style={styles.starContainer}>
                <Image
                  source={require('../../assets/game/star.png')}
                  style={styles.starImage}
                />
                <Text style={styles.scoreText}>{score}%</Text>
                <Image
                  source={require('../../assets/game/star.png')}
                  style={styles.starImage}
                />
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={styles.retakeButton} 
                onPress={handleRetakeQuiz}
              >
                <Text style={styles.retakeButtonText}>🔄 Retake Quiz</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButtonResult} onPress={handleBackToLesson}>
                <LinearGradient
                  colors={['#0052cc', '#0066ff']}
                  style={styles.backButtonGradient}
                >
                  <Text style={styles.backButtonText}>✓ Back to Lessons</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Quiz Screen
  const currentQuiz = quizData.quizzes[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.quizzes.length) * 100;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Background Image */}
      <Image
        source={require('../../assets/game/cloudySky.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToLesson} style={styles.closeButton}>
            <Image
              source={require('../../assets/backArrow.png')}
              style={{ width: 24, height: 24, tintColor: '#0052cc' }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.title}>🎯 {quizData.topic}</Text>
        </View>

        <View style={styles.quizCard}>
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1} of {quizData.quizzes.length}
            </Text>
          </View>

          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentQuiz.question}</Text>
          </View>

          {/* Answers */}
          <View style={styles.answersContainer}>
            {currentQuiz.answers.map((answer, index) => {
              const answerColors = ['#fef3c7', '#dbeafe', '#d1fae5', '#fce7f3'];
              const selectedColor = ['#fbbf24', '#3b82f6', '#10b981', '#ec4899'];
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.answerButton,
                    { backgroundColor: answerColors[index % 4] },
                    selectedAnswers[currentQuestionIndex] === index && { 
                      backgroundColor: selectedColor[index % 4],
                      borderWidth: 3,
                      borderColor: '#fff'
                    },
                  ]}
                  onPress={() => handleAnswerSelect(index)}
                >
                  <View style={styles.answerContent}>
                    <View style={[
                      styles.answerLabel,
                      { backgroundColor: selectedColor[index % 4] }
                    ]}>
                      <Text style={styles.answerLabelText}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.answerText,
                      selectedAnswers[currentQuestionIndex] === index && styles.answerTextSelected,
                    ]}>
                      {answer}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Navigation */}
          <View style={styles.navigationContainer}>
            {currentQuestionIndex > 0 && (
              <TouchableOpacity 
                style={styles.navButton} 
                onPress={handlePreviousQuestion}
              >
                <Text style={styles.navButtonText}>← Previous</Text>
              </TouchableOpacity>
            )}
            
            <View style={{ flex: 1 }} />
            
            {currentQuestionIndex < quizData.quizzes.length - 1 ? (
              <TouchableOpacity 
                style={styles.navButton} 
                onPress={handleNextQuestion}
              >
                <Text style={styles.navButtonText}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.completeButton} 
                onPress={handleCompleteQuiz}
              >
                <LinearGradient
                  colors={['#0052cc', '#0066ff']}
                  style={styles.completeButtonGradient}
                >
                  <Text style={styles.completeButtonText}>✓ Complete Quiz</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    margin: 20,
    borderRadius: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#0052cc',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  quizCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(229, 231, 235, 0.8)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0052cc',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  questionContainer: {
    backgroundColor: '#e0f2fe',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#0052cc',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 26,
  },
  answersContainer: {
    marginBottom: 24,
  },
  answerButton: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  answerButtonSelected: {
    borderWidth: 3,
    borderColor: '#0052cc',
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerLabel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  answerLabelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  answerLabelTextSelected: {
    color: 'white',
  },
  answerText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
    fontWeight: '500',
  },
  answerTextSelected: {
    fontWeight: '700',
    color: '#ffffff',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 82, 204, 0.1)',
    borderRadius: 20,
  },
  navButtonText: {
    fontSize: 16,
    color: '#0052cc',
    fontWeight: '700',
  },
  completeButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  completeButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  medalContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  medalImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  medalEmoji: {
    fontSize: 60,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 30,
    fontWeight: '600',
  },
  scoreContainer: {
    marginBottom: 40,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starImage: {
    width: 40,
    height: 40,
    marginHorizontal: 10,
    resizeMode: 'contain',
  },
  star: {
    fontSize: 32,
    marginHorizontal: 8,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0052cc',
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  retakeButton: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0052cc',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0052cc',
  },
  backButtonResult: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
