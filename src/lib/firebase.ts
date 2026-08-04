import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { EncryptedVaultData, ActivityLog } from '../types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export { app, auth, db };

// --- AUTH FUNCTIONS ---

export function usernameToEmail(username: string): string {
  const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  return `${cleaned}@vault.local`;
}

export function emailToUsername(email: string | null | undefined): string {
  if (!email) return '';
  return email.split('@')[0];
}

export function onAuthUserChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signUpUser(email: string, pass: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

export async function loginUser(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// --- FIRESTORE VAULT STORAGE ---

export async function fetchUserVaultData(userId: string): Promise<EncryptedVaultData | null> {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as EncryptedVaultData;
    }
  } catch (err) {
    console.error('Error fetching Firestore user vault:', err);
  }
  return null;
}

export async function saveUserVaultData(userId: string, vault: EncryptedVaultData): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', userId);
    vault.updatedAt = new Date().toISOString();
    await setDoc(docRef, vault, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving Firestore user vault:', err);
    return false;
  }
}

// --- FIRESTORE LOGS STORAGE ---

export async function fetchUserActivityLogs(userId: string): Promise<ActivityLog[]> {
  try {
    const logsRef = collection(db, 'users', userId, 'activityLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);
    const logs: ActivityLog[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
    });
    return logs;
  } catch (err) {
    console.error('Error fetching user activity logs:', err);
    return [];
  }
}

export async function addUserActivityLog(
  userId: string,
  action: string,
  details = '',
  category: 'auth' | 'account' | 'security' | 'backup' | 'system' = 'system'
) {
  try {
    const logsRef = collection(db, 'users', userId, 'activityLogs');
    const newLog = {
      action,
      details,
      category,
      timestamp: new Date().toISOString(),
    };
    await addDoc(logsRef, newLog);
  } catch (err) {
    console.error('Error adding user activity log:', err);
  }
}

export async function clearUserActivityLogs(userId: string): Promise<boolean> {
  try {
    const logsRef = collection(db, 'users', userId, 'activityLogs');
    const querySnapshot = await getDocs(logsRef);
    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error clearing activity logs:', err);
    return false;
  }
}
