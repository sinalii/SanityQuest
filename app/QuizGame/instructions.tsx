import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Image, Modal } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function QuizScreen() {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleBackPress = () => {
    router.back();
  };

  const handleLetsGo = () => {
    // Navigate to quiz game page
    router.push('/QuizGame/quiz-game');
  };

  const handleMenuPress = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLoginPress = () => {
    setShowDropdown(false);
    router.push('/admin/dashboard');
  };

  const handleCloseDropdown = () => {
    setShowDropdown(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
       colors={['#B8D4FD', '#B8D4FD']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity style={styles.headerButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        {/* <View style={styles.headerRight}>
          <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>
        </View> */}
      </LinearGradient>

      {/* Main Content */}
      <LinearGradient
        colors={['#B8D4FD', '#B8D4FD']}
        style={styles.mainContent}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.welcomeTitle}>
            How to play
          </Text>
          
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionCard}>
              <Text style={styles.instructionEmoji}>🧼</Text>
              <Text style={styles.instructionText}>
                You'll see questions about hygiene and water!
              </Text>
            </View>
            
            <View style={styles.instructionCard}>
              <Text style={styles.instructionEmoji}>💧</Text>
              <Text style={styles.instructionText}>
                Choose the right answer before time runs out!
              </Text>
            </View>
            
            <View style={styles.instructionCard}>
              <Text style={styles.instructionEmoji}>🌟</Text>
              <Text style={styles.instructionText}>
                Earn points, badges, and certificates!
              </Text>
            </View>
          </View>

          {/* Instructions Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/quiz/instructions.png')}
              style={styles.instructionsImage}
              resizeMode="contain"
            />
          </View>

          {/* Let's Go Button */}
          <TouchableOpacity style={styles.letsGoButton} onPress={handleLetsGo}>
            <Text style={styles.letsGoButtonText}>Let's go</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      {/* Bottom Navigation */}
      {/* <LinearGradient
        colors={['#B8D4FD', '#B8D4FD']}
        style={styles.bottomNavContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
         <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color="#4A90E2" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="trending-up" size={24} color="#000" />
            <Text style={styles.navText}>Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="settings" size={24} color="#000" />
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>
        </View> *
      </LinearGradient> */}

      {/* Dropdown Menu */}
      {/* <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseDropdown}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleCloseDropdown}
        >
          <View style={styles.dropdownContainer}>
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={handleLoginPress}
            >
              <Ionicons name="shield-checkmark" size={20} color="#0A3AAB" />
              <Text style={styles.dropdownText}>Login as Admin</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    height: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerButton: {
    marginTop:30,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'sans-serif',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 30,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0A3AAB',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'sans-serif',
    letterSpacing: 0.5,
    lineHeight: 38,
  },
  instructionsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  instructionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#0A3AAB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(10, 58, 171, 0.1)',
  },
  instructionEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A3AAB',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    lineHeight: 24,
  },
  imageContainer: {
    marginTop: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  instructionsImage: {
    width: 400,
    height: 300,
    borderRadius: 15,
  },
  letsGoButton: {
    backgroundColor: '#0A3AAB',
    borderRadius: 25,
    paddingHorizontal: 60,
    paddingVertical: 16,
    marginTop: 10,
    shadowColor: '#0A3AAB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignSelf: 'center',
  },
  letsGoButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    letterSpacing: 0.3,
  },
  bottomNavContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bottomNav: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: '100%',
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    marginTop: 4,
    fontFamily: 'sans-serif',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 20,
  },
  dropdownContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0A3AAB',
    marginLeft: 12,
    fontFamily: 'sans-serif',
  },
});