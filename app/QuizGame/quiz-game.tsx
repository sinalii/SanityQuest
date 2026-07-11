import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useQuiz } from '../../hooks/useQuiz';

export default function QuizGameScreen() {
  console.log('🎮 QuizGameScreen component loaded!');
  const { user } = useAuth();
  const { questions, loading: questionsLoading, saveProgress, saveBadge, testFirebaseConnection } = useQuiz();
  
  const [timeLeft, setTimeLeft] = useState(20);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [showTimeBadge, setShowTimeBadge] = useState(false);
  const [showFloatingBadge, setShowFloatingBadge] = useState(false);
  const [floatingBadgeType, setFloatingBadgeType] = useState<string>('');
  const [correctStreak, setCorrectStreak] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatingBadgeAnim = useRef(new Animated.Value(0)).current;
  const floatingBadgeScale = useRef(new Animated.Value(0)).current;
  const floatingBadgeOpacity = useRef(new Animated.Value(0)).current;
  const questionBounceAnim = useRef(new Animated.Value(1)).current;
  const answerBounceAnim1 = useRef(new Animated.Value(1)).current;
  const answerBounceAnim2 = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const confettiScale = useRef(new Animated.Value(0)).current;
  const answerPressAnim = useRef(new Animated.Value(1)).current;
  const questionSlideAnim = useRef(new Animated.Value(0)).current;
  const scoreCountAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  // Use Firebase data instead of hardcoded data
  const currentQuiz = questions[currentQuestion - 1];
  console.log('📊 Current state:', { 
    questionsLength: questions.length, 
    currentQuestion, 
    currentQuiz: currentQuiz ? 'exists' : 'null',
    loading: questionsLoading 
  });

  // Sound effect function
  const playBadgeSound = async () => {
    try {
      // Use a free magical chime sound from a reliable CDN
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
        { shouldPlay: true, volume: 0.8 }
      );
      // Clean up the sound after it finishes
      setTimeout(() => {
        sound.unloadAsync();
      }, 2000);
    } catch (error) {
      console.log('Error playing sound:', error);
      // Fallback: try a different sound source
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundjay.com/misc/sounds/magic-chime-02.wav' },
          { shouldPlay: true, volume: 0.8 }
        );
        setTimeout(() => {
          sound.unloadAsync();
        }, 2000);
      } catch (fallbackError) {
        console.log('Fallback sound also failed:', fallbackError);
      }
    }
  };

  // Badge animation function
  const showBadgeAnimation = (badgeType: string) => {
    if (earnedBadges.includes(badgeType)) return; // Don't show if already earned
    
    // Special haptic for badge earned
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Play magical sound effect
    playBadgeSound();
    
    setFloatingBadgeType(badgeType);
    setShowFloatingBadge(true);
    setEarnedBadges([...earnedBadges, badgeType]);
    
    // Reset animation values
    floatingBadgeAnim.setValue(0);
    floatingBadgeScale.setValue(0);
    floatingBadgeOpacity.setValue(0);
    
    // Start the floating animation
    Animated.sequence([
      // Phase 1: Appear and scale up with bounce
      Animated.parallel([
        Animated.timing(floatingBadgeScale, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(floatingBadgeOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Bounce back to normal size
      Animated.timing(floatingBadgeScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      // Phase 3: Hold for a moment
      Animated.delay(500),
      // Phase 4: Float upward and shrink
      Animated.parallel([
        Animated.timing(floatingBadgeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(floatingBadgeScale, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Phase 5: Fade out and hide
      Animated.timing(floatingBadgeOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowFloatingBadge(false);
      // Show permanent badge
      if (badgeType === 'time') {
        setShowTimeBadge(true);
      }
      // Medal badge is automatically added to earnedBadges array
    });
  };

  // Reset timer when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setTimeLeft(20);
      setCurrentQuestion(1);
      setScore(0);
      setShowFeedback(false);
      setIsCorrect(false);
      setSelectedAnswer(null);
      setShowTimeUp(false);
      setShowTimeWarning(false);
      setShowResults(false);
      setShowCompletion(false);
      setIsTimeUp(false);
      setEarnedBadges([]);
      setShowTimeBadge(false);
      setShowFloatingBadge(false);
      setFloatingBadgeType('');
      setCorrectStreak(0);
      floatingBadgeAnim.setValue(0);
      floatingBadgeScale.setValue(0);
      floatingBadgeOpacity.setValue(0);
    }, [])
  );

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !showFeedback && !showTimeUp) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !showFeedback && !showTimeUp && !showTimeWarning) {
      // Time's up - show warning with haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setIsTimeUp(true);
      setShowTimeWarning(true);
      // Auto-transition to results after 3 seconds
      setTimeout(() => {
        setShowTimeWarning(false);
        setShowResults(true);
        // Start confetti animation
        Animated.parallel([
          Animated.timing(confettiScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(particleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start();
      }, 3000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, showFeedback, showTimeUp]);


  // Pulse animation for timer
  useEffect(() => {
    if (timeLeft <= 5) {
      // Haptic warning for low time
      if (timeLeft === 5) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [timeLeft]);

  // Bouncing animations for question and answers
  useEffect(() => {
    // Question bounce animation
    const questionBounce = Animated.loop(
      Animated.sequence([
        Animated.timing(questionBounceAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(questionBounceAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Answer cards bounce animation (staggered)
    const answerBounce1 = Animated.loop(
      Animated.sequence([
        Animated.timing(answerBounceAnim1, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(answerBounceAnim1, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    const answerBounce2 = Animated.loop(
      Animated.sequence([
        Animated.delay(750), // Stagger the second card
        Animated.timing(answerBounceAnim2, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(answerBounceAnim2, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    questionBounce.start();
    answerBounce1.start();
    answerBounce2.start();

    return () => {
      questionBounce.stop();
      answerBounce1.stop();
      answerBounce2.stop();
    };
  }, [currentQuestion]);


  const handleTimeUp = () => {
    // Show time's up popup instead of auto-advancing
    setShowTimeUp(true);
  };

  const handleAnswer = (option: any) => {
    // Haptic feedback for answer selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Answer press animation
    Animated.sequence([
      Animated.timing(answerPressAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(answerPressAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedAnswer(option);
    setIsCorrect(option.correct);
    setShowFeedback(true);
    
    if (option.correct) {
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Success animation
      Animated.sequence([
        Animated.timing(answerPressAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(answerPressAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const newScore = score + 1;
      const newCorrectAnswers = correctAnswers + 1;
      const newStreak = correctStreak + 1;
      setScore(newScore);
      setCorrectAnswers(newCorrectAnswers);
      setCorrectStreak(newStreak);
      
      // Animate score counting
      Animated.timing(scoreCountAnim, {
        toValue: newScore,
        duration: 500,
        useNativeDriver: false,
      }).start();
      
      // Check for medal badge (5 correct answers in a row)
      if (newStreak === 5) {
        showBadgeAnimation('medal');
      }
    } else {
      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Shake animation for wrong answer
      Animated.sequence([
        Animated.timing(answerPressAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(answerPressAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(answerPressAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(answerPressAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const newWrongAnswers = wrongAnswers + 1;
      setWrongAnswers(newWrongAnswers);
      // Reset streak on wrong answer
      setCorrectStreak(0);
    }
  };

  const handleContinue = () => {
    // Light haptic for continue button
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Reset animations
    answerPressAnim.setValue(1);
    
    setShowFeedback(false);
    setSelectedAnswer(null);
    
    // Move to next question
    if (currentQuestion < questions.length) {
      // Question transition animation
      Animated.sequence([
        Animated.timing(questionSlideAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(questionSlideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      setCurrentQuestion(currentQuestion + 1);
      // Don't reset timer - keep it at 20 for all questions
    } else {
      // Quiz finished - pause timer and show results
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Mark as completed on time (not time up)
      setIsTimeUp(false);
      
      // Check for time badge
      if (timeLeft >= 10) {
        showBadgeAnimation('time');
      }
      
      // Go directly to results with confetti
      setShowResults(true);
      // Start confetti animation
      Animated.parallel([
        Animated.timing(confettiScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Save progress to Firebase
      saveQuizProgress();
    }
  };

  const saveQuizProgress = async () => {
    try {
      // Generate a unique user ID for anonymous users
      const userId = user ? user.uid : `anonymous-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const totalQuestions = questions.length;
      
      console.log('Starting to save quiz progress...', {
        userId,
        correctAnswers,
        wrongAnswers,
        totalQuestions,
        timeSpent,
        earnedBadges
      });
      
      // Save progress to Firebase
      const progressId = await saveProgress(
        userId,
        correctAnswers,
        wrongAnswers,
        totalQuestions,
        timeSpent,
        earnedBadges
      );

      console.log('Progress saved with ID:', progressId);

      // Save badges to Firebase
      for (const badgeType of earnedBadges) {
        const badgeName = badgeType === 'time' ? 'Speed Master' : 'Medal Master';
        const description = badgeType === 'time' 
          ? 'Completed quiz in under 2 minutes' 
          : 'Got 5 correct answers in a row';
        
        const badgeId = await saveBadge(
          userId,
          badgeType as 'time' | 'medal' | 'streak' | 'perfect',
          badgeName,
          description,
          `quiz-${Date.now()}`
        );
        
        console.log('Badge saved with ID:', badgeId);
      }

      console.log('Quiz progress saved to Firebase successfully!', { 
        userId, 
        score: Math.round((correctAnswers / totalQuestions) * 100),
        progressId 
      });
    } catch (error) {
      console.error('Error saving quiz progress:', error);
      console.error('Full error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
    }
  };

  const handleSeeResults = () => {
    setShowTimeUp(false);
    setShowResults(true);
  };

  const handleBackToHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      router.back();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [router]);

  // Show loading if questions are still loading
  if (questionsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#B8D4FD', '#B8D4FD']}
          style={styles.mainContent}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading quiz questions...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Show error if no questions loaded
  if (!questions || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#B8D4FD', '#B8D4FD']}
          style={styles.mainContent}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No quiz questions available</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#B8D4FD', '#B8D4FD']}
        style={styles.mainContent}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          {/* Timer */}
          <Animated.View style={[
            styles.timer, 
            { 
              transform: [{ scale: pulseAnim }],
              backgroundColor: timeLeft <= 5 ? '#FF6B6B' : '#1E3A8A',
              borderColor: timeLeft <= 5 ? '#DC2626' : '#3B82F6'
            }
          ]}>
            {/* Digital Clock Display */}
            <View style={styles.digitalClock}>
              <View style={[
                styles.digitalTimeContainer,
                { backgroundColor: timeLeft <= 5 ? 'rgba(255, 107, 107, 0.2)' : 'rgba(59, 130, 246, 0.2)' }
              ]}>
                <Text style={[
                  styles.digitalTime,
                  { color: timeLeft <= 5 ? '#FEF2F2' : '#E0F2FE' }
                ]}>
                  {timeLeft.toString().padStart(2, '0')}
                </Text>
              </View>
              <Text style={[
                styles.digitalLabel,
                { color: timeLeft <= 5 ? '#FEF2F2' : '#E0F2FE' }
              ]}>
                SEC
              </Text>
            </View>
          </Animated.View>

          {/* Badges */}
          <View style={styles.rightIcons}>
            {earnedBadges.includes('time') && (
              <View style={styles.badgeContainer}>
                <Text style={styles.permanentBadgeEmoji}>⌚</Text>
              </View>
            )}
            {earnedBadges.includes('medal') && (
              <View style={styles.badgeContainer}>
                <Text style={styles.permanentBadgeEmoji}>🏅</Text>
              </View>
            )}
          </View>
        </View>

        {/* Question Number */}
        <View style={styles.questionNumberContainer}>
          <View style={styles.questionNumber}>
            <Text style={styles.questionNumberText}>
              {currentQuestion.toString().padStart(2, '0')}
            </Text>
          </View>
        </View>

        {/* Question Area */}
        <View style={styles.questionArea}>
          <Animated.View style={[
            styles.questionCard,
            { 
              transform: [
                { scale: questionBounceAnim },
                { 
                  translateX: questionSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 30]
                  })
                }
              ],
              opacity: questionSlideAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 0.3, 1]
              })
            }
          ]}>
            {currentQuiz?.QuizNClean_image === "rotten_apple" ? (
              <Image
                source={require('../../assets/quiz/rotten_apple.png')}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : currentQuiz?.QuizNClean_image === "garbagebag" ? (
              <Image
                source={require('../../assets/quiz/garbagebag.png')}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : currentQuiz?.QuizNClean_image === "sneez" ? (
              <Image
                source={require('../../assets/quiz/sneez.png')}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : currentQuiz?.QuizNClean_image === "plastic" ? (
              <Image
                source={require('../../assets/quiz/plastic.png')}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : currentQuiz?.QuizNClean_image === "dirtyhands" ? (
              <Image
                source={require('../../assets/quiz/dirtyhands.png')}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : currentQuiz?.QuizNClean_image === "running_tap" ? (
              <Image
                source={require('../../assets/quiz/running_tap.png')}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : currentQuiz?.QuizNClean_image === "sleep" ? (
              <Image
                source={require('../../assets/quiz/sleep.png')}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : currentQuiz?.QuizNClean_image === "wound" ? (
              <Image
                source={require('../../assets/quiz/wound.png')}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : currentQuiz?.QuizNClean_image === "cake" ? (
              <Image
                source={require('../../assets/quiz/cake.png')}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.questionImage}>{currentQuiz?.QuizNClean_image || 'Loading...'}</Text>
            )}
          </Animated.View>
        </View>

        {/* Answer Choices */}
        <View style={styles.answerContainer}>
          {currentQuiz?.QuizNClean_options?.map((option, index) => (
            <View key={option.id} style={styles.answerWrapper}>
              {/* A/B Label */}
              <View style={styles.answerLabel}>
                <Text style={styles.answerLabelText}>
                  {index === 0 ? 'A' : 'B'}
                </Text>
              </View>
              
              {/* Answer Card */}
              <Animated.View style={[
                { 
                  transform: [
                    { scale: Animated.multiply(
                      index === 0 ? answerBounceAnim1 : answerBounceAnim2,
                      answerPressAnim
                    )},
                    { 
                      translateX: questionSlideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, index === 0 ? -20 : 20]
                      })
                    }
                  ]
                }
              ]}>
                <TouchableOpacity
                  style={[
                    styles.answerCard,
                    selectedAnswer?.id === option.id && styles.selectedAnswerCard,
                    isCorrect && selectedAnswer?.id === option.id && {
                      shadowColor: '#4CAF50',
                      shadowOpacity: 0.4,
                      shadowRadius: 15,
                      elevation: 10,
                    }
                  ]}
                  onPress={() => handleAnswer(option)}
                >
              {option.icon === "rotten_apple_throw" ? (
                <Image
                  source={require('../../assets/quiz/rotten_apple_throw.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "rotten_apple_eating" ? (
                <Image
                  source={require('../../assets/quiz/rotten_apple_eating.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "garbagebag_floor" ? (
                <Image
                  source={require('../../assets/quiz/garbagebag_floor.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "garbagebag_dustbin" ? (
                <Image
                  source={require('../../assets/quiz/garbagebag_dustbin.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "sneez_covered" ? (
                <Image
                  source={require('../../assets/quiz/sneez_covered.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "sneez_not_covered" ? (
                <Image
                  source={require('../../assets/quiz/sneez_not_covered.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "plastic_in_river" ? (
                <Image
                  source={require('../../assets/quiz/plastic_in_river.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "plastic_in_bag" ? (
                <Image
                  source={require('../../assets/quiz/plastic_in_bag.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "dirtyhands_wash" ? (
                <Image
                  source={require('../../assets/quiz/dirtyhands_wash.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "dirtyhands_eating" ? (
                <Image
                  source={require('../../assets/quiz/dirtyhands_eating.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "running_tap_close" ? (
                <Image
                  source={require('../../assets/quiz/running_tap_close.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "running_tap_ignore" ? (
                <Image
                  source={require('../../assets/quiz/running_tap_ignore.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "sleep_brush" ? (
                <Image
                  source={require('../../assets/quiz/sleep_brush.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "sleep_no_brush" ? (
                <Image
                  source={require('../../assets/quiz/sleep_no_brush.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "wound_cleanwith_mud" ? (
                <Image
                  source={require('../../assets/quiz/wound_cleanwith_mud.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "wound_cleanwith_water" ? (
                <Image
                  source={require('../../assets/quiz/wound_cleanwith_water.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "cake_lick" ? (
                <Image
                  source={require('../../assets/quiz/cake_lick.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : option.icon === "cake_spoon" ? (
                <Image
                  source={require('../../assets/quiz/cake_spoon.png')}
                  style={styles.answerIcon}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.answerIcon}>{option.icon}</Text>
              )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          ))}
        </View>

        {/* Feedback Popup */}
        {showFeedback && (
          <View style={styles.feedbackOverlay}>
            <View style={[
              styles.feedbackPopup,
              { backgroundColor: isCorrect ? '#B8D4FD' : '#FFB3B3' }
            ]}>
              <View style={styles.feedbackContent}>
                <View style={styles.feedbackIcon}>
                  <Ionicons 
                    name={isCorrect ? "checkmark" : "close"} 
                    size={24} 
                    color="white" 
                  />
                </View>
                <Text style={styles.feedbackText}>
                  {isCorrect ? "Amazing!" : "Better luck next time"}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>CONTINUE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Time Warning Popup */}
        {showTimeWarning && (
          <View style={styles.centerOverlay}>
            <Animated.View style={[
              styles.timeWarningPopup,
              { 
                transform: [
                  { scale: confettiScale },
                  { translateY: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })}
                ],
                opacity: confettiAnim
              }
            ]}>
              <View style={styles.warningIcon}>
                <Ionicons name="warning" size={60} color="#FF6B6B" />
              </View>
              <Text style={styles.warningTitle}>Time's Up! ⏰</Text>
              <Text style={styles.warningSubtitle}>Let's see how you did!</Text>
            </Animated.View>
          </View>
        )}

        {/* Results Popup with Confetti */}
        {showResults && (
          <View style={styles.centerOverlay}>
            {/* Confetti Animation */}
            <Animated.View style={[
              styles.confettiContainer,
              { 
                transform: [
                  { scale: confettiScale },
                  { rotate: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })}
                ],
                opacity: confettiAnim
              }
            ]}>
              <Animated.Text style={[
                styles.confetti,
                {
                  transform: [
                    { 
                      translateY: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -50]
                      })
                    },
                    { 
                      rotate: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg']
                      })
                    }
                  ]
                }
              ]}>🎉</Animated.Text>
              <Animated.Text style={[
                styles.confetti, 
                { 
                  marginTop: 20, 
                  marginLeft: 30,
                  transform: [
                    { 
                      translateY: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -30]
                      })
                    },
                    { 
                      rotate: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '-90deg']
                      })
                    }
                  ]
                }
              ]}>✨</Animated.Text>
              <Animated.Text style={[
                styles.confetti, 
                { 
                  marginTop: -10, 
                  marginRight: 40,
                  transform: [
                    { 
                      translateY: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -40]
                      })
                    },
                    { 
                      rotate: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '90deg']
                      })
                    }
                  ]
                }
              ]}>🎊</Animated.Text>
              <Animated.Text style={[
                styles.confetti, 
                { 
                  marginTop: 30, 
                  marginLeft: -20,
                  transform: [
                    { 
                      translateY: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -60]
                      })
                    },
                    { 
                      rotate: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '270deg']
                      })
                    }
                  ]
                }
              ]}>🌟</Animated.Text>
              <Animated.Text style={[
                styles.confetti, 
                { 
                  marginTop: -20, 
                  marginRight: -30,
                  transform: [
                    { 
                      translateY: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -35]
                      })
                    },
                    { 
                      rotate: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '-180deg']
                      })
                    }
                  ]
                }
              ]}>🎈</Animated.Text>
            </Animated.View>

            <Animated.View style={[
              styles.resultsPopup,
              { 
                backgroundColor: isTimeUp ? '#FFE5E5' : '#E8F5E8',
                borderColor: isTimeUp ? '#FF6B6B' : '#4CAF50',
                transform: [
                  { scale: confettiScale },
                  { translateY: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })}
                ],
                opacity: confettiAnim
              }
            ]}>
              <View style={styles.resultsIcon}>
                <Ionicons 
                  name={isTimeUp ? "time" : "trophy"} 
                  size={50} 
                  color={isTimeUp ? "#FF6B6B" : "#FFD700"} 
                />
              </View>
              <Text style={[
                styles.resultsTitle,
                { color: isTimeUp ? '#FF6B6B' : '#4CAF50' }
              ]}>
                {isTimeUp ? 'Time\'s Up! ⏰' : 'Great Job! 🎉'}
              </Text>
              <Text style={[
                styles.resultsSubtitle,
                { color: isTimeUp ? '#FF6B6B' : '#4CAF50' }
              ]}>
                {isTimeUp ? 'Better luck next time!' : 'Quiz Complete!'}
              </Text>
              <View style={styles.scoreContainer}>
                <Text style={[
                  styles.scoreText,
                  { color: isTimeUp ? '#FF6B6B' : '#4CAF50' }
                ]}>
                  Score: {score}
                </Text>
                <Text style={[
                  styles.statsText,
                  { color: isTimeUp ? '#FF6B6B' : '#4CAF50' }
                ]}>
                  Correct: {correctAnswers} | Wrong: {wrongAnswers}
                </Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.continueButton,
                  { backgroundColor: isTimeUp ? '#FF6B6B' : '#4CAF50' }
                ]}
                onPress={handleBackToHome}
              >
                <Text style={styles.continueButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}


        {/* Floating Badge Animation */}
        {showFloatingBadge && (
          <Animated.View 
            style={[
              styles.floatingBadge,
              {
                transform: [
                  { 
                    scale: floatingBadgeScale
                  },
                  { 
                    translateY: floatingBadgeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -300]
                    })
                  }
                ],
                opacity: floatingBadgeOpacity
              }
            ]}
          >
            <View style={styles.floatingBadgeContainer}>
              <Text style={styles.badgeEmoji}>
                {floatingBadgeType === 'time' ? '⌚' : '🏅'}
              </Text>
              <View style={styles.glowEffect} />
            </View>
          </Animated.View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#A8C8E8',
  },
  timer: {
    marginTop: 20,
    width: 90,
    height: 60,
    borderRadius: 12,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    position: 'relative',
  },
  digitalClock: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitalTimeContainer: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  digitalTime: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  digitalLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  questionNumberContainer: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  questionNumber: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  questionNumberText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#B8D4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    zIndex: 1000,
  },
  floatingBadgeContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    borderWidth: 4,
    borderColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 15,
  },
  badgeEmoji: {
    fontSize: 40,
    textAlign: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  permanentBadgeEmoji: {
    fontSize: 20,
    textAlign: 'center',
  },
  questionArea: {
     marginTop:-100,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  questionCard: {
    marginTop:-250,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 5,
    width: 280,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  questionImage: {
    fontSize: 120,
    textAlign: 'center',
    width: 270,
    height: 190,
  },
  answerContainer: {
    marginTop:-250,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingBottom: 60,
  },
  answerWrapper: {
    width: '48%',
    alignItems: 'center',
  },
  answerLabel: {
    backgroundColor: '#3B82F6',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  answerLabelText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  answerCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  answerIcon: {
    fontSize: 60,
    textAlign: 'center',
    width: 140,
    height: 140,
  },
  selectedAnswerCard: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#0A3AAB',
    shadowColor: '#0A3AAB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    transform: [{ scale: 0.98 }],
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  feedbackPopup: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  feedbackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
    textAlign: 'center',
    flex: 1,
  },
  continueButton: {
    backgroundColor: '#0A3AAB',
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 12,
    marginBottom:15,
    width: '100%',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A3AAB',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0A3AAB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  timeWarningPopup: {
    backgroundColor: '#FFE5E5',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  warningIcon: {
    marginBottom: 15,
  },
  warningTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
    textAlign: 'center',
  },
  warningSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  confetti: {
    fontSize: 40,
    position: 'absolute',
  },
  resultsPopup: {
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#4CAF50',
    zIndex: 1001,
  },
  resultsIcon: {
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreContainer: {
    marginBottom: 20,
  },
});