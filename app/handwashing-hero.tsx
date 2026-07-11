import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Get screen dimensions and calculate responsive scale
const { width, height } = Dimensions.get('window');
const scale = Math.min(width / 375, height / 812); // Base scale on iPhone X dimensions
const GAME_DURATION = 20; // 20 seconds game

export default function HandwashingHeroGame() {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Hand dragging state
  const [handPosition, setHandPosition] = useState({ 
    x: width / 2 - 40 * scale, // Center horizontally 
    y: height * 0.10 // Position in middle of screen (was 0.65, too far down)
  });
  const [handVisible, setHandVisible] = useState(false);
  
  // Target areas for drop detection
  const [targets, setTargets] = useState({
    sink: { x: 0, y: 0, width: 0, height: 0 },
    soap: { x: 0, y: 0, width: 0, height: 0 },
    tissue: { x: 0, y: 0, width: 0, height: 0 },
  });
  
  // Reference to keep track of measured elements
  const elementRefs = {
    sinkRef: useRef(null),
    soapRef: useRef(null),
    tissueRef: useRef(null),
  };
  
  const handRef = useRef<any>(null);
  
  // Store hand size for collision detection
  const [handSize, setHandSize] = useState({ width: 100 * scale, height: 100 * scale });
  
  // Animations
  const completionAnim = useRef(new Animated.Value(0)).current;
  const handAnim = useRef(new Animated.ValueXY()).current;
  
  // Ref to track current game state for PanResponder (to avoid closure issues)
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  
  // Ref to track current targets (to avoid closure issues)
  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  
  // Ref to track current step (to avoid closure issues)
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  
  // Function to check if hand is over a target
  const checkForTargetCollisions = (position: { x: number, y: number }) => {
    if (gameStateRef.current !== 'playing') {
      return;
    }
    
    // Use targetsRef.current to get the latest target positions
    const currentTargets = targetsRef.current;
    const step = currentStepRef.current;
    
    // Check collision with each target based on current step
    const { width, height } = handSize;
    const handCenter = {
      x: position.x + width / 2,
      y: position.y + height / 2
    };
    
    switch (step) {
      case 0: // Wet hands (sink)
        if (isColliding(handCenter, currentTargets.sink)) {
          setErrorMessage('');
          showCompletionAndAdvance();
        } else if (isColliding(handCenter, currentTargets.soap)) {
          setErrorMessage('Wrong! First, wet your hands at the sink.');
        } else if (isColliding(handCenter, currentTargets.tissue)) {
          setErrorMessage('Wrong! First, wet your hands at the sink.');
        }
        break;
        
      case 1: // Get soap
        if (isColliding(handCenter, currentTargets.soap)) {
          setErrorMessage('');
          showCompletionAndAdvance();
        } else if (isColliding(handCenter, currentTargets.sink)) {
          setErrorMessage('Wrong! Now get soap from the dispenser.');
        } else if (isColliding(handCenter, currentTargets.tissue)) {
          setErrorMessage('Wrong! Now get soap from the dispenser.');
        }
        break;
        
      case 2: // Wash hands (sink)
        if (isColliding(handCenter, currentTargets.sink)) {
          setErrorMessage('');
          showCompletionAndAdvance();
        } else if (isColliding(handCenter, currentTargets.soap)) {
          setErrorMessage('Wrong! Now wash your hands at the sink.');
        } else if (isColliding(handCenter, currentTargets.tissue)) {
          setErrorMessage('Wrong! Now wash your hands at the sink.');
        }
        break;
        
      case 3: // Dry with tissue
        if (isColliding(handCenter, currentTargets.tissue)) {
          setErrorMessage('');
          // On last step, just add score and complete game (don't advance step)
          setScore((prev) => prev + 25);
          completeGame();
        } else if (isColliding(handCenter, currentTargets.sink)) {
          setErrorMessage('Wrong! Now dry your hands with the tissue.');
        } else if (isColliding(handCenter, currentTargets.soap)) {
          setErrorMessage('Wrong! Now dry your hands with the tissue.');
        }
        break;
    }
  };
  
  // Helper to check if point is inside a rectangle
  const isColliding = (
    point: { x: number, y: number },
    target: { x: number, y: number, width: number, height: number }
  ) => {
    return (
      point.x >= target.x &&
      point.x <= target.x + target.width &&
      point.y >= target.y &&
      point.y <= target.y + target.height
    );
  };
  
  // Measure target components to get their positions
  const measureTarget = (name: keyof typeof targets, ref: any) => {
    if (ref && ref.current) {
      ref.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        setTargets(prev => ({
          ...prev,
          [name]: { x, y, width, height }
        }));
      });
    }
  };
  
  // Complete the game
  const completeGame = () => {
    setShowCompletionAnimation(true);
    setGameState('finished');
    
    // Run completion animation
    Animated.timing(completionAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true
    }).start();
  };
  
  // PanResponder for drag and drop
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        handAnim.setValue({ 
          x: gestureState.dx,
          y: gestureState.dy
        });
      },
      onPanResponderRelease: (_, gestureState) => {
        // Measure hand's absolute position on screen FIRST, before snapping
        if (handRef.current) {
          handRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
            // Update handSize with actual measured dimensions
            setHandSize({ width, height });
            
            // Pass the top-left position to collision check (it will calculate center)
            checkForTargetCollisions({ x, y });
          });
        }
        
        // AFTER checking collision, snap back to center
        // Use setTimeout to ensure measurement completes first
        setTimeout(() => {
          const handWidth = 100 * scale;
          const handHeight = 100 * scale;
          const snapCenterX = (width - handWidth) / 2 - 15;
          const snapCenterY = (height - handHeight) / 2 + 25;
          
          // Reset animation to 0, then set position
          Animated.timing(handAnim, {
            toValue: { x: 0, y: 0 },
            duration: 0,
            useNativeDriver: false,
          }).start(() => {
            setHandPosition({ x: snapCenterX, y: snapCenterY });
          });
        }, 50);
      }
    })
  ).current;

  // Handwashing steps with instructions and action text
  const handwashingSteps = [
    { 
      id: 1, 
      name: 'Wet Hands', 
      image: require('@/assets/images/Step1.png'), 
      completed: false,
      instruction: 'Drag your hand under the running water',
      actionText: 'Wet Hands'
    },
    { 
      id: 2, 
      name: 'Apply Soap', 
      image: require('@/assets/images/Step2.png'), 
      completed: false,
      instruction: 'Drag your hand to the soap to get soap',
      actionText: 'Apply Soap'
    },
    { 
      id: 3, 
      name: 'Wash Hands', 
      image: require('@/assets/images/Step1.png'), 
      completed: false,
      instruction: 'Drag your hand back to the sink to wash with soap',
      actionText: 'Wash Hands'
    },
    { 
      id: 4, 
      name: 'Dry Hands', 
      image: require('@/assets/images/step4.png'), 
      completed: false,
      instruction: 'Drag your hand to the tissue to dry',
      actionText: 'Dry Hands'
    },
  ];

  // Timer effect for the gameplay
  useEffect(() => {
    let timer: number | undefined;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState('finished');
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState, timeLeft]);

  // Measure target positions when game starts
  useEffect(() => {
    if (gameState === 'playing') {
      setTimeout(() => {
        measureTarget('sink', elementRefs.sinkRef);
        measureTarget('soap', elementRefs.soapRef);
        measureTarget('tissue', elementRefs.tissueRef);
      }, 100); // Small delay to ensure elements are rendered
    }
  }, [gameState]);

  // Auto-clear error message after 3 seconds
  useEffect(() => {
    if (errorMessage) {
      const timeout = setTimeout(() => {
        setErrorMessage('');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [errorMessage]);

  const handleStartGame = () => {
    setGameState('playing');
    setTimeLeft(GAME_DURATION);
    setCurrentStep(0);
    setScore(0);
    setErrorMessage('');
    
    // Reset animations
    handAnim.setValue({ x: 0, y: 0 });
    handAnim.setOffset({ x: 0, y: 0 });
    handAnim.flattenOffset();
    completionAnim.setValue(0);
    
    // Set hand position - position it near the sink area for easy testing
    const handWidth = 100 * scale;
    const handHeight = 100 * scale;
    const centerX = (width - handWidth) / 2 - 15;
    // Position hand higher on screen, near sink area (sink is around Y: 539-759)
    const centerY = 400 * scale; // Position in sink area for testing
    setHandPosition({ x: centerX, y: centerY });
    setHandVisible(true);
  };

  const showCompletionAndAdvance = () => {
    // Update score immediately
    setScore((prev) => prev + 25);
    
    setShowCompletionAnimation(true);
    Animated.timing(completionAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.bounce,
    }).start(() => {
      setTimeout(() => {
        setShowCompletionAnimation(false);
        completionAnim.setValue(0);
        
        if (currentStep < handwashingSteps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        }
      }, 500);
    });
  };

  const handlePlayAgain = () => {
    setGameState('intro');
  };

  const handleBackToHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const renderIntro = () => (
    <View style={styles.introContainer}>
      <Text style={styles.introTitle}>Handwashing Hero</Text>
      <Text style={styles.introDescription}>
        Learn the proper steps to wash your hands! Drag the hand icon to interact with objects and complete each step in the correct order.
      </Text>
      <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          style={styles.startButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.startButtonText}>Start Game</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderGame = () => (
    <View style={styles.gameContainer}>
      {/* Title */}
      <Text style={styles.gameTitle}>Handwashing Hero</Text>
        
        {/* Steps Row - 4 steps with black separator lines */}
        <View style={styles.stepsRowWrapper}>
          <View style={styles.stepsContainer}>
            {handwashingSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <View 
                  style={[
                    styles.stepBox,
                    index === currentStep && styles.activeStepBox,
                    index < currentStep && styles.completedStepBox
                  ]}
                >
                  <Image 
                    source={step.image} 
                    style={styles.stepImage} 
                    resizeMode="contain" 
                  />
                  {index < currentStep && (
                    <View style={styles.completedCheckmark}>
                      <Ionicons name="checkmark-circle" size={14 * scale} color="#10B981" />
                    </View>
                  )}
                </View>
                {index < handwashingSteps.length - 1 && (
                  <View 
                    style={[
                      styles.stepSeparator,
                      index < currentStep && styles.completedStepSeparator
                    ]} 
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
        
        {/* Instruction Text */}
        <Text style={styles.instructionText}>
          {handwashingSteps[currentStep]?.instruction || 'Complete!'}
        </Text>
        
        {/* Timer */}
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={16 * scale} color="#000" />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
        
        {/* Score */}
        <View style={styles.scoreContainer}>
          <Ionicons name="star" size={16 * scale} color="#FFD700" />
          <Text style={styles.scoreText}>{score} points</Text>
        </View>
        
        {/* Error Message */}
        {errorMessage !== '' && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16 * scale} color="#EF4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        
        {/* Divider Line */}
        <View style={styles.dividerLine} />
        
        {/* Game area with elements based on the image */}
        <View style={styles.gameArea}>
          {/* Bubbles background decoration */}
          <View style={[styles.bubble, { top: '5%', left: '10%', width: 15 * scale, height: 15 * scale }]} />
          <View style={[styles.bubble, { top: '15%', left: '25%', width: 10 * scale, height: 10 * scale }]} />
          <View style={[styles.bubble, { top: '8%', right: '20%', width: 20 * scale, height: 20 * scale }]} />
          <View style={[styles.bubble, { top: '22%', right: '10%', width: 8 * scale, height: 8 * scale }]} />
          <View style={[styles.bubble, { top: '18%', left: '5%', width: 12 * scale, height: 12 * scale }]} />
          <View style={[styles.bubble, { top: '10%', left: '40%', width: 8 * scale, height: 8 * scale }]} />
          <View style={[styles.bubble, { top: '25%', left: '70%', width: 10 * scale, height: 10 * scale }]} />
          <View style={[styles.bubble, { top: '4%', right: '35%', width: 6 * scale, height: 6 * scale }]} />
          
          {/* Hanging plants */}
          <View style={styles.hangingPlantsContainer}>
            <Image 
              source={require('@/assets/images/Flower_bunch.png')} 
              style={styles.leftHangingPlant}
              resizeMode="contain"
            />
            <Image 
              source={require('@/assets/images/Flower_bunch.png')} 
              style={styles.rightHangingPlant}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.gameElements}>
            {/* Sink */}
            <View 
              style={styles.sinkContainer}
              ref={elementRefs.sinkRef}
            >
              {/* Sink basin */}
              <Image 
                source={require('@/assets/images/sink.png')} 
                style={styles.sinkImage}
                resizeMode="contain"
              />
            </View>
            
            {/* Items on sink - positioned to overlay on the sink image */}
            <View style={styles.sinkItemsContainer}>
              {/* Soap Container (left) - green box in image */}
              <View 
                style={styles.soapDispenserContainer}
                ref={elementRefs.soapRef}
              >
                <Image 
                  source={require('@/assets/images/Soap.png')} 
                  style={styles.soapImage}
                  resizeMode="contain"
                />
              </View>
              
              {/* Soap Bar (right) - blue soap in image */}
              <View 
                style={styles.tissueContainer}
                ref={elementRefs.tissueRef}
              >
                <Image 
                  source={require('@/assets/images/Tissue.png')} 
                  style={styles.tissueImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            
            {/* Interactive draggable hand */}
            {handVisible ? (
              <Animated.View
                ref={handRef}
                {...panResponder.panHandlers}
                style={[
                  styles.draggableHand,
                  {
                    transform: [
                      { translateX: handAnim.x },
                      { translateY: handAnim.y }
                    ],
                    left: handPosition.x,
                    top: handPosition.y,
                    backgroundColor: 'transparent', // Transparent since we're using actual image
                    elevation: 9999,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 5 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                  }
                ]}
                onLayout={(event) => {
                  const layout = event.nativeEvent.layout;
                  setHandSize({
                    width: layout.width,
                    height: layout.height
                  });
                }}
              >
                <Image 
                  source={require('@/assets/images/hand.png')} 
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'contain',
                  }}
                />
              </Animated.View>
            ) : null}
            
            {/* Step completion animation */}
            {showCompletionAnimation && (
              <Animated.View
                style={[
                  styles.completionAnimation,
                  {
                    opacity: completionAnim,
                    transform: [{ scale: completionAnim }]
                  }
                ]}
              >
                <Ionicons name="checkmark-circle" size={24 * scale} color="#10B981" />
                <Text style={styles.completionText}>Step Completed!</Text>
              </Animated.View>
            )}
          </View>
        </View>
    </View>
  );

  const renderResults = () => (
    <View style={styles.resultsContainer}>
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Game Finished!</Text>
        <View style={styles.resultScoreContainer}>
          <Text style={styles.resultScoreLabel}>Your Score:</Text>
          <Text style={styles.resultScoreValue}>{score}</Text>
        </View>

        {score >= 40 && (
          <View style={styles.badgeContainer}>
            <Ionicons name="trophy" size={36 * scale} color="#FFD700" />
            <Text style={styles.badgeText}>Handwashing Hero Badge Earned!</Text>
          </View>
        )}

        <Text style={styles.resultMessage}>
          {score >= 40
            ? "Great job! You're a true Handwashing Hero!"
            : "Keep practicing to become a Handwashing Hero!"}
        </Text>

        <View style={styles.resultButtonsContainer}>
          <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
            <Text style={styles.playAgainButtonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    if (gameState === 'playing' && !handVisible) {
      setHandVisible(true);
    }
  }, [gameState, handVisible]);

  return (
    <LinearGradient colors={['#A7C7F9', '#8FB8F8']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Back button */}
        {gameState !== 'playing' && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
              <Ionicons name="arrow-back" size={24 * scale} color="#333" />
            </TouchableOpacity>
          </View>
        )}

        {/* Content based on game state */}
        {gameState === 'intro' && renderIntro()}
        {gameState === 'playing' && renderGame()}
        {gameState === 'finished' && renderResults()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A7C7F9',
    position: 'relative',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16 * scale,
    paddingTop: 20 * scale,
    paddingBottom: 10 * scale,
  },
  backButton: {
    padding: 8 * scale,
  },
  // Intro Screen
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24 * scale,
  },
  introTitle: {
    fontSize: 28 * scale,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12 * scale,
  },
  introDescription: {
    fontSize: 16 * scale,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32 * scale,
    lineHeight: 24 * scale,
  },
  startButton: {
    width: '80%',
    borderRadius: 12 * scale,
    overflow: 'hidden',
    marginTop: 20 * scale,
  },
  startButtonGradient: {
    paddingVertical: 16 * scale,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18 * scale,
    fontWeight: 'bold',
  },
  // Game Screen
  gameContainer: {
    flex: 1,
    padding: 16 * scale,
  },
  gameTitle: {
    fontSize: 24 * scale,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 5 * scale,
    marginBottom: 8 * scale,
  },
  stepsRowWrapper: {
    alignItems: 'center',
    marginTop: 5 * scale,
    marginBottom: 5 * scale,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: width * 0.85,
    backgroundColor: '#6A98D8',
    borderRadius: 20 * scale,
    paddingVertical: 6 * scale,
    paddingHorizontal: 6 * scale,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'black',
  },
  stepBox: {
    width: width * 0.16,
    height: width * 0.16,
    backgroundColor: 'white',
    borderRadius: 12 * scale,
    borderWidth: 1,
    borderColor: '#6B8CDE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepBox: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFE8E8',
  },
  instructionText: {
    fontSize: 13 * scale,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 5 * scale,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 4 * scale,
    paddingHorizontal: 12 * scale,
    borderRadius: 20 * scale,
    alignSelf: 'center',
    marginTop: 5 * scale,
    marginBottom: 5 * scale,
    width: 70 * scale,
    height: 35 * scale,
  },
  timerText: {
    fontSize: 14 * scale,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 4 * scale,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 4 * scale,
    paddingHorizontal: 12 * scale,
    borderRadius: 20 * scale,
    alignSelf: 'center',
    marginTop: 8 * scale,
    marginBottom: 5 * scale,
    minWidth: 100 * scale,
    height: 35 * scale,
  },
  scoreText: {
    fontSize: 14 * scale,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 4 * scale,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 6 * scale,
    paddingHorizontal: 12 * scale,
    borderRadius: 20 * scale,
    alignSelf: 'center',
    marginTop: 8 * scale,
    marginBottom: 5 * scale,
    minWidth: 200 * scale,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12 * scale,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 6 * scale,
    flexShrink: 1,
  },
  dividerLine: {
    height: 3 * scale,
    backgroundColor: 'white',
    marginHorizontal: 20 * scale,
    marginTop: 5 * scale,
    marginBottom: 8 * scale,
    opacity: 0.85,
  },
  stepImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  stepSeparator: {
    width: 1,
    height: '90%',
    backgroundColor: 'black',
    alignSelf: 'center',
  },
  gameArea: {
    flex: 1,
    width: '100%',
    position: 'relative',
    marginTop: 5 * scale,
    borderTopLeftRadius: 20 * scale,
    borderTopRightRadius: 20 * scale,
    paddingBottom: 10 * scale,
    backgroundColor: '#A7C7F9',
    overflow: 'visible',
  },
  gameElements: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    padding: 16 * scale,
    paddingTop: 40 * scale,
    overflow: 'visible',
  },
  
  // Bubbles decoration
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 50,
    zIndex: 1,
  },
  
  // Hanging plants
  hangingPlantsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30 * scale,
    zIndex: 2,
  },
  leftHangingPlant: {
    width: 100 * scale,
    height: 80 * scale,
    marginTop: -10 * scale,
  },
  rightHangingPlant: {
    width: 100 * scale,
    height: 80 * scale,
    marginTop: -10 * scale,
  },
  
  sinkContainer: {
    width: width * 0.85,
    height: 200 * scale,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 'auto',
    marginBottom: 100 * scale,
    zIndex: 5,
  },
  sinkImage: {
    width: '100%',
    height: 180 * scale,
    resizeMode: 'contain',
  },
  
  sinkItemsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 15,
    pointerEvents: 'none',
  },
  soapDispenserContainer: {
    position: 'absolute',
    left: '8%',
    top: '30%',
    width: 50 * scale,
    height: 50 * scale,
    pointerEvents: 'auto',
    zIndex: 16,
  },
  soapImage: {
    width: 80 * scale,
    height: 80 * scale,
    resizeMode: 'contain',
  },
  tissueContainer: {
    position: 'absolute',
    right: '15%',
    top: '30%',
    width: 60 * scale,
    height: 50 * scale,
    pointerEvents: 'auto',
    zIndex: 16,
  },
  tissueImage: {
    width: 80 * scale,
    height: 80 * scale,
    resizeMode: 'contain',
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24 * scale,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 16 * scale,
    padding: 24 * scale,
    width: '100%',
    maxWidth: 320 * scale,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  resultTitle: {
    fontSize: 24 * scale,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24 * scale,
  },
  resultScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24 * scale,
  },
  resultScoreLabel: {
    fontSize: 16 * scale,
    color: '#666',
    marginRight: 8 * scale,
  },
  resultScoreValue: {
    fontSize: 36 * scale,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  badgeContainer: {
    alignItems: 'center',
    marginVertical: 16 * scale,
  },
  badgeText: {
    fontSize: 16 * scale,
    fontWeight: '600',
    color: '#333',
    marginTop: 8 * scale,
  },
  resultMessage: {
    fontSize: 16 * scale,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24 * scale,
    lineHeight: 24 * scale,
  },
  resultButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16 * scale,
  },
  playAgainButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12 * scale,
    paddingHorizontal: 20 * scale,
    borderRadius: 12 * scale,
    flex: 1,
    marginRight: 8 * scale,
    alignItems: 'center',
  },
  playAgainButtonText: {
    color: 'white',
    fontSize: 16 * scale,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12 * scale,
    paddingHorizontal: 20 * scale,
    borderRadius: 12 * scale,
    flex: 1,
    marginLeft: 8 * scale,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#333',
    fontSize: 16 * scale,
    fontWeight: 'bold',
  },
  completionAnimation: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 10 * scale,
    paddingHorizontal: 16 * scale,
    borderRadius: 20 * scale,
    top: -60 * scale,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  completionText: {
    fontSize: 16 * scale,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8 * scale,
  },
  completedStepBox: {
    backgroundColor: '#E6FFFA',
    borderColor: '#10B981',
    borderWidth: 2 * scale,
  },
  completedCheckmark: {
    position: 'absolute',
    top: 3 * scale,
    right: 3 * scale,
    backgroundColor: 'white',
    borderRadius: 10 * scale,
  },
  completedStepSeparator: {
    backgroundColor: '#10B981',
    height: '80%',
    width: 2,
  },
  draggableHand: {
    position: 'absolute',
    width: 100 * scale,
    height: 100 * scale,
    zIndex: 9999,
    overflow: 'visible',
  },
});