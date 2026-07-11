const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAFZpaOgd_WOCF9WHT3FgJ5Yp4OqaeBa3g',
  authDomain: 'clean-water-66585.firebaseapp.com',
  projectId: 'clean-water-66585',
  storageBucket: 'clean-water-66585.firebasestorage.app',
  messagingSenderId: '143202666483',
  appId: '1:143202666483:web:fae34115dd6ce98f177486'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seedUNOfficer() {
  try {
    console.log('Creating UN Officer account...');
    
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'unofficer@gmail.com', 
      'unofficer'
    );
    
    const user = userCredential.user;
    console.log('UN Officer account created:', user.uid);
    
    // Set user role in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: 'unofficer@gmail.com',
      displayName: 'UN Officer',
      role: 'unofficer',
      createdAt: serverTimestamp(),
      department: 'United Nations Water & Sanitation',
      permissions: ['quiz_management', 'analytics', 'user_oversight']
    });
    
    console.log('UN Officer profile created successfully!');
    console.log('Login credentials:');
    console.log('Email: unofficer@gmail.com');
    console.log('Password: unofficer');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('UN Officer account already exists!');
      console.log('Login credentials:');
      console.log('Email: unofficer@gmail.com');
      console.log('Password: unofficer');
    } else {
      console.error('Error creating UN Officer account:', error);
    }
  }
}

// Run the seeding function
seedUNOfficer()
  .then(() => {
    console.log('Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
