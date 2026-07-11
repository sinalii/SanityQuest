import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../config/firebase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_SIZE = 60;
const TOUCH_AREA_SIZE = 300;
const CATCH_ZONE_HEIGHT = 300; // Bottom zone where items can be caught
const HEADER_HEIGHT = 120; // Approximate header height

type ItemType = 'catchWaterDrop' | 'water_drop' | 'rock' | 'germwaterDrop';

interface FallingItem {
  id: string;
  type: ItemType;
  x: number;
  animatedY: Animated.Value;
  speed: number;
  isBroken?: boolean;
  currentY: number; // Track current Y position
}

interface GameState {
  score: number;
  level: number;
  highScore: number;
  isPlaying: boolean;
  isPaused: boolean;
  canResume: boolean;
}

const ITEM_CONFIGS = {
  catchWaterDrop: {
    source: require('../../assets/game/catchWaterDrop.png'),
    points: 10,
    spawnChance: 0.05,
  },
  water_drop: {
    source: require('../../assets/game/water_drop.png'),
    points: 5,
    spawnChance: 0.4,
  },
  rock: {
    source: require('../../assets/game/rock.png'),
    points: -5,
    spawnChance: 0.3,
  },
  germwaterDrop: {
    source: require('../../assets/game/germwaterDrop.png'),
    points: -10,
    spawnChance: 0.25,
  },
};

export default function CatchWaterDropsGame() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    highScore: 0,
    isPlaying: false,
    isPaused: false,
    canResume: false,
  });
  
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastLevelScore, setLastLevelScore] = useState(0);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const itemIdCounter = useRef(0);

  useEffect(() => {
    loadGameData();
    return () => {
      stopGame();
    };
  }, []);

  useEffect(() => {
    // When player reaches the threshold for the current level, show results
    const target = gameState.level * 100; // 100 points per level
    if (gameState.score >= target && !showResults && gameState.isPlaying) {
      setLastLevelScore(gameState.score);
      setShowResults(true);
      // Stop spawning while results are shown
      stopGame();
    }
  }, [gameState.score]);

  const loadGameData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const gameDocRef = doc(db, 'gameScores', `${userId}_catchWaterDrops`);
      const gameDoc = await getDoc(gameDocRef);

      if (gameDoc.exists()) {
        const data = gameDoc.data();
        setGameState(prev => ({
          ...prev,
          highScore: data.highScore || 0,
          canResume: data.canResume || false,
        }));

        if (data.canResume) {
          setShowResumeDialog(true);
        }
      }
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  };

  const saveGameData = async (score: number, level: number, canResume: boolean, isHighScore = false) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const gameDocRef = doc(db, 'gameScores', `${userId}_catchWaterDrops`);
      const currentHighScore = isHighScore ? Math.max(score, gameState.highScore) : gameState.highScore;

      await setDoc(gameDocRef, {
        userId,
        gameName: 'Catch Water Drops',
        score,
        level,
        highScore: currentHighScore,
        canResume,
        savedScore: canResume ? score : 0,
        savedLevel: canResume ? level : 1,
        lastPlayed: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setGameState(prev => ({
        ...prev,
        highScore: currentHighScore,
      }));
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  };

  const resumeGame = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const gameDocRef = doc(db, 'gameScores', `${userId}_catchWaterDrops`);
      const gameDoc = await getDoc(gameDocRef);

      if (gameDoc.exists()) {
        const data = gameDoc.data();
        setGameState(prev => ({
          ...prev,
          score: data.savedScore || 0,
          level: data.savedLevel || 1,
          isPlaying: true,
          isPaused: false,
          canResume: false,
        }));
        setShowResumeDialog(false);
        startGame(data.savedScore || 0, data.savedLevel || 1);
      }
    } catch (error) {
      console.error('Error resuming game:', error);
    }
  };

  const restartGame = () => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      level: 1,
      isPlaying: true,
      isPaused: false,
      canResume: false,
    }));
    setShowResumeDialog(false);
    startGame(0, 1);
  };

  const startGame = (initialScore = 0, initialLevel = 1) => {
    setFallingItems([]);
    setGameState(prev => ({
      ...prev,
      score: initialScore,
      level: initialLevel,
      isPlaying: true,
      isPaused: false,
    }));
    startSpawning(initialLevel);
  };

  const stopGame = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }
  };

  const pauseGame = async () => {
    setGameState(prev => ({ ...prev, isPaused: true }));
    stopGame();
    await saveGameData(gameState.score, gameState.level, true);
  };

  const continueGame = () => {
    setGameState(prev => ({ ...prev, isPaused: false }));
    startSpawning(gameState.level);
  };

  const endGame = async () => {
    stopGame();
    const isNewHighScore = gameState.score > gameState.highScore;
    await saveGameData(gameState.score, gameState.level, false, isNewHighScore);
    
    
  };

  const getRandomItemType = (): ItemType => {
    const random = Math.random();
    let cumulativeChance = 0;

    for (const [type, config] of Object.entries(ITEM_CONFIGS)) {
      cumulativeChance += config.spawnChance;
      if (random <= cumulativeChance) {
        return type as ItemType;
      }
    }
    return 'water_drop';
  };

  const spawnItem = (level: number) => {
    const itemType = getRandomItemType();
    const x = Math.random() * (SCREEN_WIDTH - ITEM_SIZE);
    
    const baseSpeed = 4000;
    const speedMultiplier = Math.max(0.6, 1 - (level - 1) * 0.04);
    const speed = baseSpeed * speedMultiplier;

    const animatedY = new Animated.Value(-ITEM_SIZE);
    
    const newItem: FallingItem = {
      id: `item_${itemIdCounter.current++}`,
      type: itemType,
      x,
      animatedY: animatedY,
      speed,
      isBroken: false,
      currentY: -ITEM_SIZE,
    };

    setFallingItems(prev => [...prev, newItem]);

    // Add listener to track Y position
    const listenerId = animatedY.addListener(({ value }) => {
      setFallingItems(prev => 
        prev.map(item => 
          item.id === newItem.id ? { ...item, currentY: value } : item
        )
      );
    });

    Animated.timing(animatedY, {
      toValue: SCREEN_HEIGHT,
      duration: speed,
      useNativeDriver: true,
    }).start(() => {
      animatedY.removeListener(listenerId);
      setFallingItems(prev => prev.filter(item => item.id !== newItem.id));
    });
  };

  const startSpawning = (level: number) => {
    stopGame();

    const baseSpawnInterval = 1000;
    const spawnMultiplier = Math.max(0.3, 1 - (level - 1) * 0.05);
    const spawnInterval = baseSpawnInterval * spawnMultiplier;

    const initialSpawnCount = Math.min(2 + Math.floor(level / 2), 5);
    for (let i = 0; i < initialSpawnCount; i++) {
      setTimeout(() => spawnItem(level), i * 300);
    }

    spawnIntervalRef.current = setInterval(() => {
      spawnItem(level);
    }, spawnInterval);
  };

  const handleItemPress = (item: FallingItem) => {
    // Don't allow touching already broken items
    if (item.isBroken) {
      return;
    }

    const catchZoneStartY = SCREEN_HEIGHT - CATCH_ZONE_HEIGHT - HEADER_HEIGHT;
    
    // Check if item is in the catch zone
    if (item.currentY < catchZoneStartY) {
      // Item not in catch zone yet
      Alert.alert('Too Early', '⚠️ Wait for items to reach the blue catch zone!');
      return;
    }

    const points = ITEM_CONFIGS[item.type].points;
    const newScore = Math.max(0, gameState.score + points);
    
    // If it's a water drop (positive points), show broken animation
    if (points > 0) {
      // Speak positive encouragement for clean/special drops
      try {
        const positiveText = item.type === 'catchWaterDrop'
          ? 'Awesome!'
          : 'Good job!';
        Speech.speak(positiveText, { language: 'en-US', pitch: 1.05, rate: 1.0 });
      } catch (e) {
        console.warn('Speech failed', e);
      }
      setFallingItems(prev => 
        prev.map(i => i.id === item.id ? { ...i, isBroken: true } : i)
      );
      
      setTimeout(() => {
        setFallingItems(prev => prev.filter(i => i.id !== item.id));
      }, 200);
    } else {
      // Speak caution for negative items (rocks/germs)
      try {
        const negativeText = item.type === 'rock'
          ? 'Oops!'
          : 'Oh no';
        Speech.speak(negativeText, { language: 'en-US', pitch: 0.95, rate: 0.95 });
      } catch (e) {
        console.warn('Speech failed', e);
      }
      // For rocks and germs, remove immediately
      setFallingItems(prev => prev.filter(i => i.id !== item.id));
    }
    
    setGameState(prev => ({
      ...prev,
      score: newScore,
    }));

    // Check for game over
    if (newScore === 0 && gameState.score > 0 && points < 0) {
      endGame();
    }
  };

  const handleBackPress = () => {
    if (gameState.isPlaying && !gameState.isPaused) {
      Alert.alert(
        'Pause Game',
        'Do you want to pause and save your progress?',
        [
          { text: 'Continue Playing', style: 'cancel' },
          {
            text: 'Pause & Save',
            onPress: async () => {
              await pauseGame();
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleNextLevel = () => {
    // Move to next level (if any) and resume spawning
    setShowResults(false);
    setGameState(prev => ({ ...prev, level: Math.min(10, prev.level + 1), isPlaying: true, isPaused: false }));
    // Start spawning again at new level
    startSpawning(Math.min(10, gameState.level + 1));
  };

  const handleBackToHome = async () => {
    // Save and go back to dashboard
    await saveGameData(gameState.score, gameState.level, false);
    router.push('/student/dashboard');
  };

  if (showResults) {
    const score = lastLevelScore;
    return (
      <LinearGradient
        colors={['#e6f7ff', '#cfe6ff']}
        style={styles.container}
      >
        <StatusBar style="dark" />
        <View style={styles.resultsContainer}>
          <View style={styles.resultsCard}>
            <View style={styles.medalContainer}>
              <Text style={styles.medalEmoji}>🏅</Text>
            </View>
            
            <Text style={styles.resultsTitle}>Great!</Text>
            <Text style={styles.resultsSubtitle}>Level {gameState.level} Completed</Text>
            
            <View style={styles.scoreContainer}>
              <View style={styles.starContainer}>
                <Text style={styles.star}>⭐</Text>
                <Text style={styles.scoreText}>{score}</Text>
                <Text style={styles.star}>⭐</Text>
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={styles.retakeButton} 
                onPress={() => {
                  // Retake: restart level keeping same level
                  setShowResults(false);
                  startGame(0, gameState.level);
                }}
              >
                <Text style={styles.retakeButtonText}>🔄 Retake Level</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButtonResult} onPress={handleBackToHome}>
                <LinearGradient
                  colors={['#0f62fe', '#0052cc']}
                  style={styles.backButtonGradient}
                >
                  <Text style={styles.backButtonText}>Home</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.nextButton} onPress={handleNextLevel}>
                <LinearGradient
                  colors={['#0f62fe', '#0052cc']}
                  style={styles.nextButtonGradient}
                >
                  <Text style={styles.nextButtonText}>Next Level ➜</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Image */}
      <Image
        source={require('../../assets/game/cloudySky.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Header with Stats */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Image
            source={require('../../assets/backArrow.png')}
            style={{ width: 24, height: 24, tintColor: '#0052cc' }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          {/* Level */}
          <View style={styles.statCard}>
            <Image
              source={require('../../assets/game/catchWaterDrop.png')}
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>{gameState.level}/10</Text>
          </View>
          
          {/* Score */}
          <View style={styles.statCard}>
            <Image
              source={require('../../assets/game/star.png')}
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>{gameState.score}</Text>
          </View>
          
          {/* High Score */}
          <View style={styles.statCard}>
            <Image
              source={require('../../assets/game/medle.png')}
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>{gameState.highScore}</Text>
          </View>
        </View>

        {gameState.isPlaying && !gameState.isPaused && (
          <TouchableOpacity onPress={pauseGame} style={styles.pauseButton}>
            <Text style={styles.pauseIcon}>⏸</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.gameArea}>
        {!gameState.isPlaying ? (
          <View style={styles.startContainer}>
            <View style={styles.gameIconContainer}>
              <Image
                source={require('../../assets/game/water_drop.png')}
                style={styles.gameIcon}
              />
            </View>
            
            <Text style={styles.gameTitle}>Catch Water Drops</Text>
            <Text style={styles.gameSubtitle}>Let's Learn to Save Water!</Text>
            
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionTitle}>🎮 How to Play:</Text>
              
              <View style={styles.instructionItem}>
                <View style={[styles.instructionIcon, { backgroundColor: '#e3f2fd' }]}>
                  <Text style={styles.instructionEmoji}>💧</Text>
                </View>
                <Text style={styles.instructionText}>Catch clean water drops +5</Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={[styles.instructionIcon, { backgroundColor: '#e1f5fe' }]}>
                  <Text style={styles.instructionEmoji}>🌊</Text>
                </View>
                <Text style={styles.instructionText}>Special drops +10 points</Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={[styles.instructionIcon, { backgroundColor: '#ffebee' }]}>
                  <Text style={styles.instructionEmoji}>🪨</Text>
                </View>
                <Text style={styles.instructionText}>Avoid rocks -5 points</Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={[styles.instructionIcon, { backgroundColor: '#fff3e0' }]}>
                  <Text style={styles.instructionEmoji}>🦠</Text>
                </View>
                <Text style={styles.instructionText}>Avoid germs -10 points</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => startGame()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#0052cc', '#0066ff']}
                style={styles.startButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.startButtonText}>🎮 Start Game</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : gameState.isPaused ? (
          <View style={styles.startContainer}>
            <View style={styles.pauseIconContainer}>
              <Text style={styles.pauseIconLarge}>⏸️</Text>
            </View>
            
            <Text style={styles.gameTitle}>Game Paused</Text>
            <Text style={styles.pauseSubtitle}>Take a break!</Text>
            
            <View style={styles.pauseStatsCard}>
              <View style={styles.pauseStatRow}>
                <View style={styles.pauseStatItem}>
                  <Image
                    source={require('../../assets/game/star.png')}
                    style={styles.pauseStatIcon}
                  />
                  <Text style={styles.pauseStatLabel}>Score</Text>
                  <Text style={styles.pauseStatValue}>{gameState.score}</Text>
                </View>
                
                <View style={styles.pauseStatDivider} />
                
                <View style={styles.pauseStatItem}>
                  <Image
                    source={require('../../assets/game/catchWaterDrop.png')}
                    style={styles.pauseStatIcon}
                  />
                  <Text style={styles.pauseStatLabel}>Level</Text>
                  <Text style={styles.pauseStatValue}>{gameState.level}</Text>
                </View>
                
                <View style={styles.pauseStatDivider} />
                
                <View style={styles.pauseStatItem}>
                  <Image
                    source={require('../../assets/game/medle.png')}
                    style={styles.pauseStatIcon}
                  />
                  <Text style={styles.pauseStatLabel}>Best</Text>
                  <Text style={styles.pauseStatValue}>{gameState.highScore}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.startButton}
              onPress={continueGame}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.startButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.startButtonText}>▶️ Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.startButton, styles.endGameButton]}
              onPress={() => {
                endGame();
                router.back();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.endGameButtonText}>End Game & Go Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {fallingItems.map((item) => (
              <Animated.View
                key={item.id}
                style={[
                  styles.fallingItem,
                  {
                    left: item.x,
                    transform: [{ translateY: item.animatedY }],
                  },
                ]}
                pointerEvents="box-none"
              >
                <TouchableOpacity
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                  style={styles.touchArea}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <Image
                    source={
                      item.isBroken && (item.type === 'water_drop' || item.type === 'catchWaterDrop')
                        ? require('../../assets/game/watedrop_brok.png')
                        : ITEM_CONFIGS[item.type].source
                    }
                    style={[
                      styles.itemImage,
                      item.isBroken && { opacity: 0.3, transform: [{ scale: 1.2 }] }
                    ]}
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}

            <View style={styles.catchZone}>
              <Text style={styles.catchZoneText}>✋ TAP ITEMS HERE ✋</Text>
            </View>
          </>
        )}
      </View>

      <Modal
        visible={showResumeDialog}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Welcome Back!</Text>
            <Text style={styles.modalText}>
              You have a saved game. Would you like to continue where you left off?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={resumeGame}
              >
                <Text style={styles.modalButtonTextPrimary}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={restartGame}
              >
                <Text style={styles.modalButtonTextSecondary}>New Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backIcon: {
    fontSize: 24,
    color: '#0052cc',
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 10,
    marginRight: 10,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    minWidth: 80,
    justifyContent: 'center',
  },
  statIcon: {
    width: 28,
    height: 28,
    marginRight: 6,
    resizeMode: 'contain',
  },
  statContainer: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#0f62fe',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pauseIcon: {
    fontSize: 20,
    color: '#0052cc',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 20,
    borderRadius: 20,
  },
  gameIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    marginTop: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  gameIcon: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  gameTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f62fe',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameSubtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  instructionsCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e3f2fd',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionEmoji: {
    fontSize: 20,
  },
  instructionText: {
    fontSize: 15,
    color: '#1f2937',
    flex: 1,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
    fontWeight: '600',
  },
  goalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#0052cc',
  },
  goalIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    resizeMode: 'contain',
  },
  goalText: {
    fontSize: 15,
    color: '#0052cc',
    fontWeight: 'bold',
  },
  pauseIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff3e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  pauseIconLarge: {
    fontSize: 50,
  },
  pauseSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  pauseStatsCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e3f2fd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pauseStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  pauseStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  pauseStatIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  pauseStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  pauseStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0052cc',
  },
  pauseStatDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  gameInstructions: {
    fontSize: 16,
    color: '#1e5a8e',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  startButton: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginVertical: 6,
  },
  startButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  endGameButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#dc2626',
    elevation: 0,
  },
  endGameButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'center',
    paddingVertical: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0f62fe',
  },
  secondaryButtonText: {
    color: '#0f62fe',
  },
  fallingItem: {
    position: 'absolute',
    zIndex: 10,
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
  touchArea: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    resizeMode: 'contain',
  },
  catchZone: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    height: CATCH_ZONE_HEIGHT,
    backgroundColor: 'rgba(100, 180, 255, 0.15)',
    borderTopWidth: 3,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catchZoneText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    opacity: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#0f62fe',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0f62fe',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0052cc',
  },
  /* Results screen styles */
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultsCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 6,
  },
  medalContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60,
    marginBottom: 12,
  },
  medalEmoji: {
    fontSize: 36,
  },
  resultsTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 18,
  },
  scoreContainer: {
    marginVertical: 12,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  star: {
    fontSize: 20,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  buttonGroup: {
    width: '100%',
    marginTop: 12,
    gap: 10,
  },
  retakeButton: {
    backgroundColor: '#e6f7ff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#0f62fe',
    fontWeight: '700',
  },
  backButtonResult: {
    marginTop: 8,
  },
  backButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 12,
    alignItems: 'center',
  },
backButtonText: {
    fontSize: 16,
  color: '#0f62fe',
    fontWeight: '600',
  },
  
  nextButton: {
    marginTop: 8,
  },
  nextButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 12,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
});