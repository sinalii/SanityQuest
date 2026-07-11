import { auth, db } from '@/config/firebase';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Lesson {
  id: string;
  topic: string;
  content: string;
  videoUrl: string | null;
  createdAt: any;
}

export default function LessonDashboard() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [checkingQuiz, setCheckingQuiz] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLessons();
    fetchCompletedLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const lessonsQuery = query(collection(db, 'lessons'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(lessonsQuery);

      const fetchedLessons: Lesson[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLessons.push({
          id: doc.id,
          ...doc.data(),
        } as Lesson);
      });

      setLessons(fetchedLessons);
    } catch (error: any) {
      console.error('Error fetching lessons:', error);
      Alert.alert('Error', 'Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedLessons = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const scoresQuery = query(collection(db, 'lessonScores'), where('userId', '==', user.uid), where('score', '==', 100));
      const querySnapshot = await getDocs(scoresQuery);

      const completed = new Set<string>();
      querySnapshot.forEach((doc) => {
        completed.add(doc.data().lessonId);
      });

      setCompletedLessonIds(completed);
    } catch (error) {
      console.error('Error fetching completed lessons:', error);
    }
  };

  const handleLessonPress = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCheckingQuiz(true);

    // Check if quiz exists
    try {
      const quizzesQuery = query(
        collection(db, 'quizzes'),
        where('lessonId', '==', lesson.id)
      );
      const querySnapshot = await getDocs(quizzesQuery);
      setHasQuiz(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking quiz:', error);
      setHasQuiz(false);
    } finally {
      setCheckingQuiz(false);
    }
  };

  const handleStartQuiz = () => {
    if (selectedLesson) {
      router.push({
        pathname: '/student/lesson-quiz-page',
        params: { lessonId: selectedLesson.id },
      });
    }
  };

  const handleBackToList = () => {
    setSelectedLesson(null);
    setHasQuiz(false);
  };

  const renderLesson = ({ item, index }: { item: Lesson; index: number }) => {
    // Fun gradient colors for each lesson card
    const cardColors: [string, string][] = [
      ['#a7c7e7', '#b8d8f0'],
      ['#ffd1dc', '#ffe4e9'],
      ['#c8e6c9', '#d7f0d8'],
      ['#fff4b8', '#fff9d4'],
      ['#e1bee7', '#ead4f0'],
    ];
    const colors = cardColors[index % cardColors.length];
    
    return (
      <TouchableOpacity
        style={styles.lessonCard}
        onPress={() => handleLessonPress(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Image 
                source={require('../../assets/game/hand_washing_soap.png')} 
                style={styles.iconImage}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.lessonTitle}>{item.topic}</Text>
              <Text style={styles.lessonSubtitle}>
                {item.content.substring(0, 60)}...
              </Text>
            </View>
          </View>

          {item.videoUrl && (
            <Video
              source={{ uri: item.videoUrl }}
              style={styles.lessonVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
            />
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.reviewButton}
              onPress={() => handleLessonPress(item)}
            >
              <Text style={styles.reviewButtonText}>📖 Learn Now</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
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
          <Text style={styles.loadingText}>📚 Loading Lessons...</Text>
        </View>
      </View>
    );
  }

  // Show selected lesson content
  if (selectedLesson) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Image
          source={require('../../assets/game/cloudySky.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={handleBackToList} style={styles.backButtonRound}>
            <Image
              source={require('../../assets/backArrow.png')}
              style={{ width: 24, height: 24, tintColor: '#0052cc' }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.contentCard}>
            <Text style={styles.title}>{selectedLesson.topic}</Text>

            {selectedLesson.videoUrl && (
              <Video
                source={{ uri: selectedLesson.videoUrl }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
              />
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🤔 Why is this important?</Text>
              <View style={styles.bulletPoint}>
                <Text style={styles.bulletIcon}>✓</Text>
                <Text style={styles.bulletText}>To Stay Healthy</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bulletIcon}>✓</Text>
                <Text style={styles.bulletText}>For Good Health</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bulletIcon}>✓</Text>
                <Text style={styles.bulletText}>To Help Others</Text>
              </View>
            </View>

            {checkingQuiz ? (
              <ActivityIndicator size="small" color="#8b5cf6" style={{ marginTop: 20 }} />
            ) : hasQuiz && (
              <TouchableOpacity style={styles.quizButton} onPress={handleStartQuiz}>
                <LinearGradient
                  colors={['#0052cc', '#0052cc']}
                  style={styles.quizButtonGradient}
                >
                  <Text style={styles.quizButtonText}>Start Quiz</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Show lesson list
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Background Image */}
      <Image
        source={require('../../assets/game/cloudySky.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonRound}>
          <Image
            source={require('../../assets/backArrow.png')}
            style={{ width: 24, height: 24, tintColor: '#0052cc' }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📚 Your Lessons</Text>
          <View style={styles.completedBadge}>
            <Image
              source={require('../../assets/game/star.png')}
              style={styles.badgeIcon}
            />
            <Text style={styles.subtitle}>{completedLessonIds.size} Completed</Text>
          </View>
        </View>
      </View>

      {lessons.filter(lesson => !completedLessonIds.has(lesson.id)).length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>All Lessons Completed!</Text>
          <Text style={styles.emptySubtitle}>
            Great job! You've mastered all available lessons.
          </Text>
        </View>
      ) : (
        <FlatList
          data={lessons.filter(lesson => !completedLessonIds.has(lesson.id))}
          renderItem={renderLesson}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    margin: 20,
    borderRadius: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonRound: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: {
    flex: 1,
    marginLeft: 15,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  badgeIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
    resizeMode: 'contain',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0052cc',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    margin: 20,
    borderRadius: 20,
  },
  emptyEmoji: {
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
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  iconImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  iconEmoji: {
    fontSize: 30,
  },
  headerText: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  lessonSubtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  lessonVideo: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#000',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  reviewButton: {
    backgroundColor: '#0052cc',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    minWidth: 150,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    marginTop:20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  video: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#000',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingVertical: 8,
    paddingRight: 8,
    borderRadius: 8,
  },
  bulletIcon: {
    fontSize: 18,
    color: '#10b981',
    marginRight: 8,
    fontWeight: 'bold',
  },
  bulletText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
    fontWeight: '600',
  },
  quizButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginTop: 20,
  },
  quizButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  quizButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
