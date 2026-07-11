# Quiz Game Integration

This document explains how the quiz game has been integrated into the HandWashGame-Integration app.

## What Was Added

### 1. Quiz Game Components
- **`app/QuizGame/index.tsx`** - Main quiz dashboard
- **`app/QuizGame/quiz-game.tsx`** - The actual quiz game component
- **`hooks/useQuiz.ts`** - Custom hook for quiz functionality
- **`hooks/useAuth.ts`** - Custom hook for authentication

### 2. Features
- **Interactive Quiz Game**: Visual quiz with images and multiple choice answers
- **Timer System**: 20-second timer per question with visual countdown
- **Badge System**: Earn badges for speed and accuracy
- **Progress Tracking**: Save quiz progress to Firebase
- **Sound Effects**: Audio feedback for badge achievements
- **Responsive Design**: Works on different screen sizes

### 3. Firebase Integration
- **Quiz Questions**: Stored in `QuizNClean` collection
- **Progress Tracking**: Saved in `quizProgress` collection
- **Badge System**: Stored in `quizBadges` collection

## How to Use

### 1. Access the Quiz
1. Log in as a child user
2. On the main dashboard, tap "Quizzes"
3. Select "Clean & Safe Quiz" to start playing

### 2. Playing the Quiz
- Each question shows an image and two answer options
- Tap the correct answer to earn points
- Complete all questions within the time limit
- Earn badges for speed and accuracy

### 3. Badges
- **Speed Master** (⌚): Complete quiz in under 2 minutes
- **Medal Master** (🏅): Get 5 correct answers in a row

## Technical Details

### File Structure
```
app/QuizGame/
├── index.tsx          # Quiz dashboard
└── quiz-game.tsx      # Main quiz game

hooks/
├── useQuiz.ts         # Quiz logic and Firebase integration
└── useAuth.ts         # Authentication hook

assets/quiz/           # Quiz images and assets
```

### Dependencies Added
- `expo-av` - For audio playback
- `@react-navigation/native` - For navigation hooks

### Firebase Collections
- **QuizNClean**: Quiz questions and answers
- **quizProgress**: User progress and scores
- **quizBadges**: Earned badges and achievements

## Setup Instructions

### 1. Install Dependencies
```bash
npm install expo-av @react-navigation/native
```

### 2. Add Quiz Questions to Firebase
Run the seed script to add sample questions:
```bash
node scripts/seed-quiz-questions.js
```

### 3. Add Quiz Assets
Copy the quiz images to the `assets/quiz/` directory:
- rotten_apple.png
- garbagebag.png
- sneez.png
- plastic.png
- dirtyhands.png
- running_tap.png
- sleep.png
- wound.png
- And their corresponding answer option images

## Customization

### Adding New Questions
1. Add questions to the `QuizNClean` collection in Firebase
2. Follow the existing structure:
   ```javascript
   {
     QuizNClean_image: "image_name",
     QuizNClean_options: [
       { id: "1a", icon: "icon_name", correct: true },
       { id: "1b", icon: "icon_name", correct: false }
     ]
   }
   ```

### Modifying Game Settings
- **Timer Duration**: Change `timeLeft` initial value in `quiz-game.tsx`
- **Badge Requirements**: Modify badge logic in `handleAnswer` function
- **Visual Styling**: Update styles in the `StyleSheet` objects

### Adding New Badge Types
1. Add new badge types to the `QuizBadge` interface
2. Update badge logic in the quiz game component
3. Add corresponding emoji and animation logic

## Troubleshooting

### Common Issues
1. **Images not loading**: Check that all quiz images are in the correct assets directory
2. **Firebase errors**: Verify Firebase configuration and permissions
3. **Audio not playing**: Check device volume and audio permissions

### Debug Mode
Enable console logging by checking the browser console or React Native debugger for detailed error messages.

## Future Enhancements

- Multiple quiz categories
- Difficulty levels
- Leaderboards
- More interactive animations
- Voice narration
- Multiplayer support
