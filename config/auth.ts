import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

function getAuthErrorMessage(error: any) {
  const code = error?.code as string | undefined;

  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try signing in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Firebase. Please check your connection and try again.';
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Account was created, but Firestore blocked saving the user profile. Update your Firebase Firestore rules to allow users to create their own profile document.';
    default:
      return error?.message || 'Authentication failed.';
  }
}

export async function signIn(email: string, password: string) {
  console.log('signIn called with:', { email: email.trim(), password: password ? '***' : 'empty' });
  
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    console.log('Firebase auth successful:', { uid: cred.user.uid, email: cred.user.email });
    
    // Fetch user role from Firestore
    console.log('Fetching user document from Firestore...');
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    const userData = userDoc.data();
    console.log('User document data:', userData);
    
    const role = userData?.role || 'student';
    console.log('User role:', role);
    
    return { user: cred.user, role };
  } catch (error) {
    console.error('signIn error:', error);
    throw error;
  }
}

export async function signUp(email: string, password: string, displayName?: string, role: string = 'student') {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }

    await setDoc(
      doc(db, 'users', cred.user.uid),
      {
        uid: cred.user.uid,
        email: cred.user.email ?? email.trim(),
        displayName: displayName ?? cred.user.displayName ?? '',
        role: role,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    return cred.user;
  } catch (err: any) {
    console.error('Failed to save user profile to Firestore:', err);

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await deleteUser(currentUser);
      } catch (deleteError) {
        console.error('Failed to roll back partially created auth user:', deleteError);
      }
    }

    throw new Error(getAuthErrorMessage(err));
  }
}

