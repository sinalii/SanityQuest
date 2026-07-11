import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    updateDoc
} from 'firebase/firestore';
import { db } from '../firebase.config';

// Game data collection
const GAME_DATA_COLLECTION = 'gameData';
const PLAYER_SCORES_COLLECTION = 'playerScores';
const GERMBUSTER_COLLECTION = 'germbuster';

// Analytics Events
export const ANALYTICS_EVENTS = {
  GAME_STARTED: 'game_started',
  GAME_COMPLETED: 'game_completed',
  TOOL_SELECTED: 'tool_selected',
  WRONG_TOOL_SELECTED: 'wrong_tool_selected',
  SCENARIO_COMPLETED: 'scenario_completed',
  GAME_OVER: 'game_over'
};

// Log analytics event (simplified for React Native)
export const logAnalyticsEvent = (eventName, parameters = {}) => {
  try {
    console.log(`Analytics event: ${eventName}`, parameters);
    // In a real app, you'd send this to your analytics service
  } catch (error) {
    console.error('Error logging analytics event:', error);
  }
};

// Save game session data
export const saveGameSession = async (sessionData) => {
  try {
    const docRef = await addDoc(collection(db, GAME_DATA_COLLECTION), {
      ...sessionData,
      timestamp: new Date(),
      createdAt: new Date().toISOString()
    });
    console.log('Game session saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving game session:', error);
    throw error;
  }
};

// Save player score
export const savePlayerScore = async (playerData) => {
  try {
    const docRef = await addDoc(collection(db, PLAYER_SCORES_COLLECTION), {
      ...playerData,
      timestamp: new Date(),
      createdAt: new Date().toISOString()
    });
    console.log('Player score saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving player score:', error);
    throw error;
  }
};

// Get top scores
export const getTopScores = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, PLAYER_SCORES_COLLECTION),
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const scores = [];
    querySnapshot.forEach((doc) => {
      scores.push({ id: doc.id, ...doc.data() });
    });
    return scores;
  } catch (error) {
    console.error('Error getting top scores:', error);
    throw error;
  }
};

// Get game statistics
export const getGameStatistics = async () => {
  try {
    const gameDataSnapshot = await getDocs(collection(db, GAME_DATA_COLLECTION));
    const scoresSnapshot = await getDocs(collection(db, PLAYER_SCORES_COLLECTION));
    
    const totalGames = gameDataSnapshot.size;
    const totalPlayers = scoresSnapshot.size;
    
    let totalScore = 0;
    scoresSnapshot.forEach((doc) => {
      totalScore += doc.data().score || 0;
    });
    
    const averageScore = totalPlayers > 0 ? totalScore / totalPlayers : 0;
    
    return {
      totalGames,
      totalPlayers,
      averageScore,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting game statistics:', error);
    throw error;
  }
};

// Update game session
export const updateGameSession = async (sessionId, updateData) => {
  try {
    const sessionRef = doc(db, GAME_DATA_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    console.log('Game session updated:', sessionId);
  } catch (error) {
    console.error('Error updating game session:', error);
    throw error;
  }
};

// Delete game session
export const deleteGameSession = async (sessionId) => {
  try {
    await deleteDoc(doc(db, GAME_DATA_COLLECTION, sessionId));
    console.log('Game session deleted:', sessionId);
  } catch (error) {
    console.error('Error deleting game session:', error);
    throw error;
  }
};

// Save GermBuster Lab game data
export const saveGermBusterData = async (gameData) => {
  try {
    const germBusterData = {
      createdAt: new Date().toISOString(),
      level: gameData.level || 1,
      playerName: gameData.playerName || 'Anonymous',
      score: gameData.score || 0,
      testConnection: gameData.testConnection || 'success',
      timestamp: new Date()
    };
    
    const docRef = await addDoc(collection(db, GERMBUSTER_COLLECTION), germBusterData);
    console.log('GermBuster data saved with ID:', docRef.id);
    console.log('GermBuster data:', germBusterData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving GermBuster data:', error);
    throw error;
  }
};
