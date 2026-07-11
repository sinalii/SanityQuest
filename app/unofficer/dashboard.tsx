import { auth, db } from '@/config/firebase';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { signOut } from 'firebase/auth';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface QuizStats {
  totalQuizzes: number;
  totalQuestions: number;
  totalAttempts: number;
  averageScore: number;
}

export default function UNOfficerDashboard() {
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalQuizzes: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizStats();
  }, []);

  const fetchQuizStats = async () => {
    try {
      setLoading(true);
      
      // Fetch quiz progress data
      const progressQuery = query(collection(db, 'quizProgress'), orderBy('createdAt', 'desc'));
      const progressSnapshot = await getDocs(progressQuery);
      
      // Fetch quiz questions data
      const questionsQuery = query(collection(db, 'QuizNClean'));
      const questionsSnapshot = await getDocs(questionsQuery);
      
      // Calculate stats
      const totalAttempts = progressSnapshot.size;
      const totalQuestions = questionsSnapshot.size;
      
      let totalScore = 0;
      progressSnapshot.forEach(doc => {
        const data = doc.data();
        totalScore += data.correctAnswers || 0;
      });
      
      const averageScore = totalAttempts > 0 ? Math.round((totalScore / totalAttempts) * 100) / 100 : 0;
      
      setQuizStats({
        totalQuizzes: 1, // We have one main quiz
        totalQuestions,
        totalAttempts,
        averageScore,
      });
    } catch (error: any) {
      console.error('Error fetching quiz stats:', error);
      Alert.alert('Error', 'Failed to fetch quiz statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/unofficer/login');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleViewAllQuizzes = () => {
    router.push('/unofficer/view-quizzes');
  };

  const handleCreateQuiz = () => {
    router.push('/unofficer/create-quiz');
  };

  const handleEditQuiz = () => {
    router.push('/unofficer/edit-quiz');
  };


  const handleQuizAnalytics = () => {
    router.push('/unofficer/quiz-analytics');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>UN Officer</Text>
            <Text style={styles.welcomeText}>Dashboard</Text>
            <Text style={styles.subtitle}>Quiz Management System</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[styles.statCardGradient, { backgroundColor: '#3B82F6' }]}
            >
              {loading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <>
                  <Text style={styles.statNumber}>{quizStats.totalQuizzes}</Text>
                  <Text style={styles.statLabel}>Total Quizzes</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.statCard}>
            <View
              style={[styles.statCardGradient, { backgroundColor: '#FFD700' }]}
            >
              {loading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <>
                  <Text style={styles.statNumber}>{quizStats.totalQuestions}</Text>
                  <Text style={styles.statLabel}>Total Questions</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.statCard}>
            <View
              style={[styles.statCardGradient, { backgroundColor: '#1E3A8A' }]}
            >
              {loading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <>
                  <Text style={styles.statNumber}>{quizStats.totalAttempts}</Text>
                  <Text style={styles.statLabel}>Quiz Attempts</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.statCard}>
            <View
              style={[styles.statCardGradient, { backgroundColor: '#4CAF50' }]}
            >
              {loading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <>
                  <Text style={styles.statNumber}>{quizStats.averageScore}</Text>
                  <Text style={styles.statLabel}>Avg Score</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Quiz Management Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiz Management</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleViewAllQuizzes}
          >
            <View
              style={[styles.actionButtonGradient, { backgroundColor: '#3B82F6' }]}
            >
              <Text style={styles.actionButtonText}>📊 View All Quizzes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCreateQuiz}
          >
            <View
              style={[styles.actionButtonGradient, { backgroundColor: '#4CAF50' }]}
            >
              <Text style={styles.actionButtonText}>➕ Create New Quiz</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEditQuiz}
          >
            <View
              style={[styles.actionButtonGradient, { backgroundColor: '#1E3A8A' }]}
            >
              <Text style={styles.actionButtonText}>✏️ Edit Quiz</Text>
            </View>
          </TouchableOpacity>


          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleQuizAnalytics}
          >
            <View
              style={[styles.actionButtonGradient, { backgroundColor: '#FFD700' }]}
            >
              <Text style={styles.actionButtonText}>📈 Quiz Analytics</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statCardGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
