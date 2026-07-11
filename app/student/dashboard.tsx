import { auth, db } from '@/config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ChildProfile {
  name: string;
  age: number;
  avatarId: string;
  generatedAvatarUrl?: string;
}

const avatarImages: Record<string, any> = {
  child1: require('../../assets/images/avatar_child_1.png'),
  child2: require('../../assets/images/avatar_child_2.png'),
  child3: require('../../assets/images/avatar_child_3.png'),
  animal1: require('../../assets/images/avatar_animal_1.png'),
  animal2: require('../../assets/images/avatar_animal_2.png'),
  animal3: require('../../assets/images/avatar_animal_3.png'),
  character1: require('../../assets/images/avatar_hero_1.png'),
  character2: require('../../assets/images/avatar_hero_2.png'),
  character3: require('../../assets/images/avatar_hero_3.png'),
};

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        router.replace('/login/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (userData?.childProfile) {
        setProfile(userData.childProfile as ChildProfile);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const scoresQuery = query(collection(db, 'lessonScores'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(scoresQuery);

      let completed = 0;
      let points = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.score === 100) {
          completed++;
          points += data.score;
        }
      });

      setCompletedLessons(completed);
      setTotalPoints(points);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProfile(), fetchStats()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
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
              router.replace('/login/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/child_profile/child_profile');
  };

  const getAvatarSource = () => {
    if (!profile) return null;
    
    if (profile.avatarId === 'generated' && profile.generatedAvatarUrl) {
      return { uri: profile.generatedAvatarUrl };
    }
    
    return avatarImages[profile.avatarId] || avatarImages.child1;
  };

  if (loading) {
    return (
      <LinearGradient
         colors={["#d7e9ff", "#cfe6ff"]}
        style={styles.container}
      >
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
     colors={["#d7e9ff", "#cfe6ff"]}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8b5cf6']} />
      }>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.greeting}>Welcome Back! 👋</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          
          {profile && (
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <Image 
                  source={getAvatarSource()} 
                  style={styles.avatar}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.profileAge}>{profile.age} years old</Text>
              </View>
              <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Learning Sections */}
        <View style={styles.sectionsContainer}>
          <Text style={styles.sectionTitle}>Start Learning</Text>
          
          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push('/student/lesson-dashboard')}
          >
            <LinearGradient
              colors={['#8b5cf6', '#a78bfa']}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <Text style={styles.cardEmoji}>📚</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Lessons</Text>
                <Text style={styles.cardDescription}>
                  Learn about hygiene and handwashing
                </Text>
              </View>
              <Text style={styles.cardArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push('/student/games-dashboard')}
          >
            <LinearGradient
              colors={['#ec4899', '#f472b6']}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <Text style={styles.cardEmoji}>🎮</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Games</Text>
                <Text style={styles.cardDescription}>
                  Play fun games and earn rewards
                </Text>
              </View>
              <Text style={styles.cardArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push('/QuizGame')}
          >
            <LinearGradient
              colors={['#3b82f6', '#60a5fa']}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <Text style={styles.cardEmoji}>❓</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Quizzes</Text>
                <Text style={styles.cardDescription}>
                  Test your knowledge with quizzes
                </Text>
              </View>
              <Text style={styles.cardArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push('/student/progress')}
          >
            <LinearGradient
              colors={['#10b981', '#34d399']}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <Text style={styles.cardEmoji}>📊</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>My Progress</Text>
                <Text style={styles.cardDescription}>
                  Track your learning journey
                </Text>
              </View>
              <Text style={styles.cardArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{completedLessons}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalPoints}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
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
  header: {
    marginBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
    marginRight: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileAge: {
    fontSize: 14,
    color: '#6b7280',
  },
  editButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  sectionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cardArrow: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});
