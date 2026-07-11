const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqJ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q",
  authDomain: "handwashgame-12345.firebaseapp.com",
  projectId: "handwashgame-12345",
  storageBucket: "handwashgame-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample quiz questions
const quizQuestions = [
  {
    QuizNClean_image: "rotten_apple",
    QuizNClean_options: [
      {
        id: "1a",
        icon: "rotten_apple_throw",
        correct: true
      },
      {
        id: "1b",
        icon: "rotten_apple_eating",
        correct: false
      }
    ]
  },
  {
    QuizNClean_image: "garbagebag",
    QuizNClean_options: [
      {
        id: "2a",
        icon: "garbagebag_floor",
        correct: false
      },
      {
        id: "2b",
        icon: "garbagebag_dustbin",
        correct: true
      }
    ]
  },
  {
    QuizNClean_image: "sneez",
    QuizNClean_options: [
      {
        id: "3a",
        icon: "sneez_covered",
        correct: true
      },
      {
        id: "3b",
        icon: "sneez_not_covered",
        correct: false
      }
    ]
  },
  {
    QuizNClean_image: "plastic",
    QuizNClean_options: [
      {
        id: "4a",
        icon: "plastic_in_river",
        correct: false
      },
      {
        id: "4b",
        icon: "plastic_in_bag",
        correct: true
      }
    ]
  },
  {
    QuizNClean_image: "dirtyhands",
    QuizNClean_options: [
      {
        id: "5a",
        icon: "dirtyhands_wash",
        correct: true
      },
      {
        id: "5b",
        icon: "dirtyhands_eating",
        correct: false
      }
    ]
  },
  {
    QuizNClean_image: "running_tap",
    QuizNClean_options: [
      {
        id: "6a",
        icon: "running_tap_close",
        correct: true
      },
      {
        id: "6b",
        icon: "running_tap_ignore",
        correct: false
      }
    ]
  },
  {
    QuizNClean_image: "sleep",
    QuizNClean_options: [
      {
        id: "7a",
        icon: "sleep_brush",
        correct: true
      },
      {
        id: "7b",
        icon: "sleep_no_brush",
        correct: false
      }
    ]
  },
  {
    QuizNClean_image: "wound",
    QuizNClean_options: [
      {
        id: "8a",
        icon: "wound_cleanwith_mud",
        correct: false
      },
      {
        id: "8b",
        icon: "wound_cleanwith_water",
        correct: true
      }
    ]
  }
];

async function seedQuizQuestions() {
  try {
    console.log('Starting to seed quiz questions...');
    
    for (const question of quizQuestions) {
      await addDoc(collection(db, 'QuizNClean'), question);
      console.log(`Added question: ${question.QuizNClean_image}`);
    }
    
    console.log('Successfully seeded all quiz questions!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding quiz questions:', error);
    process.exit(1);
  }
}

seedQuizQuestions();
