import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

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
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  try {
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
  } catch (err: any) {
    // Surface Firestore errors clearly to the caller
    console.error('Failed to save user profile to Firestore:', err);
    throw new Error(err?.message || 'Failed to save user profile');
  }
  return cred.user;
}

