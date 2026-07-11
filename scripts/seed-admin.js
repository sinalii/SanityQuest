/**
 * Admin Seeder Script
 * 
 * This script creates a default admin user in Firebase.
 * Run this once to set up your admin account.
 * 
 * Usage: node scripts/seed-admin.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// Make sure to add your service account key file to the project
const serviceAccount = require('../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

// Default admin credentials
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '123456';
const ADMIN_NAME = 'System Administrator';

async function seedAdmin() {
  try {
    console.log('🌱 Starting admin seeder...\n');

    // Check if admin already exists
    try {
      const existingUser = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   UID: ${existingUser.uid}\n`);
      
      // Update role in Firestore if needed
      const userDoc = await db.collection('users').doc(existingUser.uid).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        await db.collection('users').doc(existingUser.uid).set({
          uid: existingUser.uid,
          email: existingUser.email,
          displayName: ADMIN_NAME,
          role: 'admin',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log('✅ Updated admin role in Firestore\n');
      }
      
      return;
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create admin user in Firebase Auth
    console.log('📝 Creating admin user in Firebase Auth...');
    const userRecord = await auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
      emailVerified: true,
    });

    console.log('✅ Admin user created in Firebase Auth');
    console.log(`   UID: ${userRecord.uid}\n`);

    // Create admin profile in Firestore
    console.log('📝 Creating admin profile in Firestore...');
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: ADMIN_NAME,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Admin profile created in Firestore\n');

    console.log('🎉 Admin seeding completed successfully!\n');
    console.log('📋 Admin Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n⚠️  Please change the password after first login!\n');

  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seeder
seedAdmin();
