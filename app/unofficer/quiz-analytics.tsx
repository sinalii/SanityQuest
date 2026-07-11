import { db } from '@/config/firebase';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface QuizProgress {
  id: string;
  userId: string;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  createdAt: any;
  wrongQuestionIds?: string[]; // Track which specific questions were wrong
}

interface QuestionStats {
  questionId: string;
  questionText: string;
  wrongCount: number;
  totalAttempts: number;
  wrongPercentage: number;
}

interface AnalyticsData {
  totalAttempts: number;
  uniqueUsers: number;
  averageScore: number;
  completionRate: number;
  averageTimeSpent: number;
  recentAttempts: QuizProgress[];
  scoreDistribution: { range: string; count: number }[];
  questionStats: QuestionStats[];
}

export default function QuizAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalAttempts: 0,
    uniqueUsers: 0,
    averageScore: 0,
    completionRate: 0,
    averageTimeSpent: 0,
    recentAttempts: [],
    scoreDistribution: [],
    questionStats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch quiz progress data
      const progressQuery = query(collection(db, 'quizProgress'), orderBy('createdAt', 'desc'));
      const progressSnapshot = await getDocs(progressQuery);
      
      // Fetch quiz questions data
      const questionsQuery = query(collection(db, 'QuizNClean'));
      const questionsSnapshot = await getDocs(questionsQuery);
      
      const attempts: QuizProgress[] = [];
      const uniqueUserIds = new Set<string>();
      
      progressSnapshot.forEach(doc => {
        const data = doc.data();
        attempts.push({
          id: doc.id,
          userId: data.userId,
          correctAnswers: data.correctAnswers || 0,
          wrongAnswers: data.wrongAnswers || 0,
          totalQuestions: data.totalQuestions || 0,
          timeSpent: data.timeSpent || 0,
          createdAt: data.createdAt,
          wrongQuestionIds: data.wrongQuestionIds || [], // Track wrong questions
        });
        uniqueUserIds.add(data.userId);
      });

      // If no real data, use sample data for demonstration
      if (attempts.length === 0) {
        const sampleAttempts: QuizProgress[] = [
          {
            id: 'sample1',
            userId: 'user1',
            correctAnswers: 6,
            wrongAnswers: 2,
            totalQuestions: 8,
            timeSpent: 120,
            createdAt: new Date(),
            wrongQuestionIds: ['q1', 'q3'],
          },
          {
            id: 'sample2',
            userId: 'user2',
            correctAnswers: 5,
            wrongAnswers: 3,
            totalQuestions: 8,
            timeSpent: 95,
            createdAt: new Date(),
            wrongQuestionIds: ['q1', 'q2', 'q5'],
          },
          {
            id: 'sample3',
            userId: 'user3',
            correctAnswers: 7,
            wrongAnswers: 1,
            totalQuestions: 8,
            timeSpent: 110,
            createdAt: new Date(),
            wrongQuestionIds: ['q2'],
          },
          {
            id: 'sample4',
            userId: 'user1',
            correctAnswers: 4,
            wrongAnswers: 4,
            totalQuestions: 8,
            timeSpent: 150,
            createdAt: new Date(),
            wrongQuestionIds: ['q1', 'q2', 'q4', 'q6'],
          },
          {
            id: 'sample5',
            userId: 'user4',
            correctAnswers: 8,
            wrongAnswers: 0,
            totalQuestions: 8,
            timeSpent: 90,
            createdAt: new Date(),
            wrongQuestionIds: [],
          },
        ];
        
        attempts.push(...sampleAttempts);
        sampleAttempts.forEach(attempt => uniqueUserIds.add(attempt.userId));
      }

      // Calculate analytics
      const totalAttempts = attempts.length;
      const uniqueUsers = uniqueUserIds.size;
      const totalScore = attempts.reduce((sum, attempt) => sum + attempt.correctAnswers, 0);
      const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.totalQuestions, 0);
      const totalTimeSpent = attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0);
      
      const averageScore = totalAttempts > 0 ? Math.round((totalScore / totalAttempts) * 100) / 100 : 0;
      const completionRate = totalAttempts > 0 ? Math.round((attempts.filter(a => a.correctAnswers + a.wrongAnswers === a.totalQuestions).length / totalAttempts) * 100) : 0;
      const averageTimeSpent = totalAttempts > 0 ? Math.round(totalTimeSpent / totalAttempts) : 0;

      // Score distribution
      const scoreDistribution = [
        { range: '0-20%', count: attempts.filter(a => (a.correctAnswers / a.totalQuestions) * 100 <= 20).length },
        { range: '21-40%', count: attempts.filter(a => (a.correctAnswers / a.totalQuestions) * 100 > 20 && (a.correctAnswers / a.totalQuestions) * 100 <= 40).length },
        { range: '41-60%', count: attempts.filter(a => (a.correctAnswers / a.totalQuestions) * 100 > 40 && (a.correctAnswers / a.totalQuestions) * 100 <= 60).length },
        { range: '61-80%', count: attempts.filter(a => (a.correctAnswers / a.totalQuestions) * 100 > 60 && (a.correctAnswers / a.totalQuestions) * 100 <= 80).length },
        { range: '81-100%', count: attempts.filter(a => (a.correctAnswers / a.totalQuestions) * 100 > 80).length },
      ];

      // Calculate question statistics (which questions are answered wrong most often)
      const questionStats: QuestionStats[] = [];
      
      // Sample question data for demonstration
      const sampleQuestions = [
        { id: 'q1', text: 'What should you do with a running tap?' },
        { id: 'q2', text: 'What should you do when you sneeze?' },
        { id: 'q3', text: 'What should you do with a rotten apple?' },
        { id: 'q4', text: 'What should you do with dirty hands?' },
        { id: 'q5', text: 'What should you do with plastic waste?' },
        { id: 'q6', text: 'What should you do before sleeping?' },
        { id: 'q7', text: 'What should you do with a wound?' },
        { id: 'q8', text: 'What should you do with a garbage bag?' },
      ];

      // If we have real questions from Firebase, use them, otherwise use sample data
      if (questionsSnapshot.size > 0) {
        questionsSnapshot.forEach(doc => {
          const questionData = doc.data();
          const questionId = doc.id;
          const questionText = questionData.QuizNClean_question || 'Unknown Question';
          
          // Count how many times this question was answered wrong
          const wrongCount = attempts.reduce((count, attempt) => {
            return count + (attempt.wrongQuestionIds?.includes(questionId) ? 1 : 0);
          }, 0);
          
          const totalAttemptsForQuestion = attempts.length;
          const wrongPercentage = totalAttemptsForQuestion > 0 ? Math.round((wrongCount / totalAttemptsForQuestion) * 100) : 0;
          
          questionStats.push({
            questionId,
            questionText: questionText.length > 50 ? questionText.substring(0, 50) + '...' : questionText,
            wrongCount,
            totalAttempts: totalAttemptsForQuestion,
            wrongPercentage,
          });
        });
      } else {
        // Use sample question data
        sampleQuestions.forEach(question => {
          const wrongCount = attempts.reduce((count, attempt) => {
            return count + (attempt.wrongQuestionIds?.includes(question.id) ? 1 : 0);
          }, 0);
          
          const totalAttemptsForQuestion = attempts.length;
          const wrongPercentage = totalAttemptsForQuestion > 0 ? Math.round((wrongCount / totalAttemptsForQuestion) * 100) : 0;
          
          questionStats.push({
            questionId: question.id,
            questionText: question.text,
            wrongCount,
            totalAttempts: totalAttemptsForQuestion,
            wrongPercentage,
          });
        });
      }

      // Sort by wrong percentage (highest first)
      questionStats.sort((a, b) => b.wrongPercentage - a.wrongPercentage);

      setAnalytics({
        totalAttempts,
        uniqueUsers,
        averageScore,
        completionRate,
        averageTimeSpent,
        recentAttempts: attempts.slice(0, 10), // Last 10 attempts
        scoreDistribution,
        questionStats,
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Quiz Analytics</Text>
          <Text style={styles.subtitle}>Performance insights and statistics</Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{analytics.totalAttempts}</Text>
            <Text style={styles.metricLabel}>Total Quiz Plays</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{analytics.uniqueUsers}</Text>
            <Text style={styles.metricLabel}>Unique Users</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{analytics.averageScore}</Text>
            <Text style={styles.metricLabel}>Avg Score</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{analytics.completionRate}%</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </View>
        </View>

        {/* Question Difficulty Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions Players Get Wrong Most Often</Text>
          <View style={styles.questionStatsContainer}>
            {analytics.questionStats.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No question data available</Text>
              </View>
            ) : (
              analytics.questionStats.map((question, index) => (
                <View key={question.questionId} style={styles.questionStatItem}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                    <Text style={styles.questionText}>{question.questionText}</Text>
                  </View>
                  <View style={styles.questionBarContainer}>
                    <View style={styles.questionBar}>
                      <View 
                        style={[
                          styles.questionBarFill, 
                          { width: `${question.wrongPercentage}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.questionPercentage}>{question.wrongPercentage}%</Text>
                  </View>
                  <Text style={styles.questionDetails}>
                    {question.wrongCount} wrong out of {question.totalAttempts} attempts
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Score Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Distribution</Text>
          <View style={styles.distributionContainer}>
            {analytics.scoreDistribution.map((item, index) => (
              <View key={index} style={styles.distributionItem}>
                <Text style={styles.distributionRange}>{item.range}</Text>
                <View style={styles.distributionBar}>
                  <View 
                    style={[
                      styles.distributionBarFill, 
                      { width: `${(item.count / analytics.totalAttempts) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.distributionCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Attempts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Attempts</Text>
          {analytics.recentAttempts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No attempts yet</Text>
            </View>
          ) : (
            analytics.recentAttempts.map((attempt, index) => (
              <View key={attempt.id} style={styles.attemptCard}>
                <View style={styles.attemptHeader}>
                  <Text style={styles.attemptId}>Attempt #{index + 1}</Text>
                  <Text style={styles.attemptDate}>{formatDate(attempt.createdAt)}</Text>
                </View>
                <View style={styles.attemptStats}>
                  <Text style={styles.attemptStat}>
                    Score: {attempt.correctAnswers}/{attempt.totalQuestions}
                  </Text>
                  <Text style={styles.attemptStat}>
                    Time: {formatTime(attempt.timeSpent)}
                  </Text>
                  <Text style={styles.attemptStat}>
                    Percentage: {Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)}%
                  </Text>
                </View>
              </View>
            ))
          )}
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
    color: '#1E3A8A',
    fontSize: 16,
    marginTop: 10,
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
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#3B82F6',
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
  questionStatsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionStatItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginRight: 10,
    minWidth: 25,
  },
  questionText: {
    fontSize: 14,
    color: '#1E3A8A',
    flex: 1,
    lineHeight: 20,
  },
  questionBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  questionBar: {
    flex: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginRight: 10,
    overflow: 'hidden',
  },
  questionBarFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  questionPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
    minWidth: 40,
    textAlign: 'right',
  },
  questionDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  distributionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distributionRange: {
    fontSize: 14,
    color: '#1E3A8A',
    width: 60,
    fontWeight: '600',
  },
  distributionBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 10,
  },
  distributionCount: {
    fontSize: 14,
    color: '#1E3A8A',
    width: 30,
    textAlign: 'right',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#3B82F6',
  },
  attemptCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  attemptId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  attemptDate: {
    fontSize: 14,
    color: '#3B82F6',
  },
  attemptStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attemptStat: {
    fontSize: 14,
    color: '#1E3A8A',
  },
});
