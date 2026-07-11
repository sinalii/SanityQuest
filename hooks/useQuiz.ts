import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../config/firebase';

export interface QuizQuestion {
  id: string;
  QuizNClean_image: string;
  QuizNClean_options: Array<{
    id: string;
    icon: string;
    correct: boolean;
  }>;
}

export interface QuizProgress {
  userId: string;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  earnedBadges: string[];
  timestamp: any;
}

export interface QuizBadge {
  userId: string;
  badgeType: 'time' | 'medal' | 'streak' | 'perfect';
  badgeName: string;
  description: string;
  quizId: string;
  timestamp: any;
}

export function useQuiz() {
  console.log('🔧 useQuiz hook initialized');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 useEffect triggered - calling loadQuestions()');
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      console.log('Attempting to connect to Firestore...');
      console.log('Database instance:', db);
      
      const questionsRef = collection(db, 'QuizNClean');
      console.log('Questions collection reference:', questionsRef);
      
      const snapshot = await getDocs(questionsRef);
      console.log('Snapshot received:', snapshot);
      console.log('Snapshot size:', snapshot.size);
      
      const questionsData: QuizQuestion[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Processing document:', doc.id, data);
        questionsData.push({
          id: doc.id,
          QuizNClean_image: data.QuizNClean_image || '',
          QuizNClean_options: data.QuizNClean_options || []
        });
      });
      
      setQuestions(questionsData);
      console.log('Loaded quiz questions:', questionsData.length);
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      // Fallback to hardcoded questions if Firebase fails
      setQuestions(getHardcodedQuestions());
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (
    userId: string,
    correctAnswers: number,
    wrongAnswers: number,
    totalQuestions: number,
    timeSpent: number,
    earnedBadges: string[]
  ) => {
    try {
      console.log('Attempting to save quiz progress:', {
        userId,
        correctAnswers,
        wrongAnswers,
        totalQuestions,
        timeSpent,
        earnedBadges
      });

      const progressData: Omit<QuizProgress, 'id'> = {
        userId,
        correctAnswers,
        wrongAnswers,
        totalQuestions,
        timeSpent,
        earnedBadges,
        timestamp: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'quizProgress'), progressData);
      console.log('Quiz progress saved successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving quiz progress:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error; // Re-throw to handle in calling function
    }
  };

  const saveBadge = async (
    userId: string,
    badgeType: 'time' | 'medal' | 'streak' | 'perfect',
    badgeName: string,
    description: string,
    quizId: string
  ) => {
    try {
      console.log('Attempting to save quiz badge:', {
        userId,
        badgeType,
        badgeName,
        description,
        quizId
      });

      const badgeData: Omit<QuizBadge, 'id'> = {
        userId,
        badgeType,
        badgeName,
        description,
        quizId,
        timestamp: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'quizBadges'), badgeData);
      console.log('Quiz badge saved successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving quiz badge:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error; // Re-throw to handle in calling function
    }
  };

  // Test Firebase connectivity
  const testFirebaseConnection = async () => {
    try {
      console.log('Testing Firebase connection...');
      const testRef = collection(db, 'test');
      const testDoc = await addDoc(testRef, { 
        test: true, 
        timestamp: serverTimestamp() 
      });
      console.log('Firebase connection test successful!', testDoc.id);
      return true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return false;
    }
  };

  return {
    questions,
    loading,
    saveProgress,
    saveBadge,
    testFirebaseConnection
  };
}

// Fallback hardcoded questions for when Firebase is not available
function getHardcodedQuestions(): QuizQuestion[] {
  return [
    {
      id: '1',
      QuizNClean_image: 'rotten_apple',
      QuizNClean_options: [
        {
          id: '1a',
          icon: 'rotten_apple_throw',
          correct: true
        },
        {
          id: '1b',
          icon: 'rotten_apple_eating',
          correct: false
        }
      ]
    },
    {
      id: '2',
      QuizNClean_image: 'garbagebag',
      QuizNClean_options: [
        {
          id: '2a',
          icon: 'garbagebag_floor',
          correct: false
        },
        {
          id: '2b',
          icon: 'garbagebag_dustbin',
          correct: true
        }
      ]
    },
    {
      id: '3',
      QuizNClean_image: 'sneez',
      QuizNClean_options: [
        {
          id: '3a',
          icon: 'sneez_covered',
          correct: true
        },
        {
          id: '3b',
          icon: 'sneez_not_covered',
          correct: false
        }
      ]
    },
    {
      id: '4',
      QuizNClean_image: 'plastic',
      QuizNClean_options: [
        {
          id: '4a',
          icon: 'plastic_in_river',
          correct: false
        },
        {
          id: '4b',
          icon: 'plastic_in_bag',
          correct: true
        }
      ]
    },
    {
      id: '5',
      QuizNClean_image: 'dirtyhands',
      QuizNClean_options: [
        {
          id: '5a',
          icon: 'dirtyhands_wash',
          correct: true
        },
        {
          id: '5b',
          icon: 'dirtyhands_eating',
          correct: false
        }
      ]
    },
    {
      id: '6',
      QuizNClean_image: 'running_tap',
      QuizNClean_options: [
        {
          id: '6a',
          icon: 'running_tap_close',
          correct: true
        },
        {
          id: '6b',
          icon: 'running_tap_ignore',
          correct: false
        }
      ]
    },
    {
      id: '7',
      QuizNClean_image: 'sleep',
      QuizNClean_options: [
        {
          id: '7a',
          icon: 'sleep_brush',
          correct: true
        },
        {
          id: '7b',
          icon: 'sleep_no_brush',
          correct: false
        }
      ]
    },
    {
      id: '8',
      QuizNClean_image: 'wound',
      QuizNClean_options: [
        {
          id: '8a',
          icon: 'wound_cleanwith_mud',
          correct: false
        },
        {
          id: '8b',
          icon: 'wound_cleanwith_water',
          correct: true
        }
      ]
    }
  ];
}
