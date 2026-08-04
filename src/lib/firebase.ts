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
import { hashString } from './crypto';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export { app, auth, db };

export interface VaultUser {
  uid: string;
  email: string | null;
  isLocal?: boolean;
}

// --- AUTH LISTENERS & STATE ---

let authListeners: ((user: VaultUser | null) => void)[] = [];

function notifyAuthListeners(user: VaultUser | null) {
  authListeners.forEach((cb) => cb(user));
}

export function usernameToEmail(username: string): string {
  const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  return `${cleaned}@vault.local`;
}

export function emailToUsername(email: string | null | undefined): string {
  if (!email) return '';
  return email.split('@')[0];
}

export function onAuthUserChanged(callback: (user: VaultUser | null) => void) {
  authListeners.push(callback);

  // First check if local session exists
  const savedLocal = localStorage.getItem('current_local_vault_user');
  let hasLocal = false;
  if (savedLocal) {
    try {
      const parsed = JSON.parse(savedLocal);
      if (parsed && parsed.uid) {
        hasLocal = true;
        callback(parsed);
      }
    } catch (e) {}
  }

  const unsubscribeFirebase = onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      localStorage.removeItem('current_local_vault_user');
      callback(fbUser);
    } else if (!hasLocal) {
      const checkAgain = localStorage.getItem('current_local_vault_user');
      if (checkAgain) {
        try {
          callback(JSON.parse(checkAgain));
        } catch (e) {
          callback(null);
        }
      } else {
        callback(null);
      }
    }
  });

  return () => {
    authListeners = authListeners.filter((cb) => cb !== callback);
    unsubscribeFirebase();
  };
}

export async function signUpUser(email: string, pass: string, rawUserId?: string): Promise<VaultUser> {
  const userId = rawUserId || emailToUsername(email);
  const cleanId = userId.toLowerCase().trim();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  } catch (err: any) {
    console.warn('Firebase signUp error, checking Firestore/local account fallback:', err?.code);
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/admin-restricted-operation' ||
      err.code === 'auth/invalid-credential' ||
      err.message?.includes('operation-not-allowed')
    ) {
      // Check local storage
      const accountsRaw = localStorage.getItem('local_vault_accounts') || '{}';
      const accounts = JSON.parse(accountsRaw);

      if (accounts[cleanId]) {
        const error = new Error('This User ID is already registered.') as any;
        error.code = 'auth/email-already-in-use';
        throw error;
      }

      // Check Firestore
      try {
        const accountDocRef = doc(db, 'userAccounts', cleanId);
        const docSnap = await getDoc(accountDocRef);
        if (docSnap.exists()) {
          const error = new Error('This User ID is already registered.') as any;
          error.code = 'auth/email-already-in-use';
          throw error;
        }
      } catch (fsErr: any) {
        if (fsErr?.code === 'auth/email-already-in-use') throw fsErr;
      }

      const passHash = await hashString(pass, cleanId);
      const accountData = { userId: cleanId, passHash, createdAt: new Date().toISOString() };

      accounts[cleanId] = accountData;
      localStorage.setItem('local_vault_accounts', JSON.stringify(accounts));

      try {
        await setDoc(doc(db, 'userAccounts', cleanId), accountData);
      } catch (e) {
        console.warn('Could not save userAccount to Firestore:', e);
      }

      const localUser: VaultUser = {
        uid: `local_${cleanId}`,
        email: `${cleanId}@vault.local`,
        isLocal: true,
      };
      localStorage.setItem('current_local_vault_user', JSON.stringify(localUser));
      notifyAuthListeners(localUser);
      return localUser;
    }
    throw err;
  }
}

export async function loginUser(email: string, pass: string, rawUserId?: string): Promise<VaultUser> {
  const userId = rawUserId || emailToUsername(email);
  const cleanId = userId.toLowerCase().trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  } catch (err: any) {
    console.warn('Firebase login error, checking Firestore/local account fallback:', err?.code);
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential' ||
      err.message?.includes('operation-not-allowed')
    ) {
      const accountsRaw = localStorage.getItem('local_vault_accounts') || '{}';
      const accounts = JSON.parse(accountsRaw);

      let targetPassHash: string | null = null;
      if (accounts[cleanId] && accounts[cleanId].passHash) {
        targetPassHash = accounts[cleanId].passHash;
      } else {
        // Fetch from Firestore if not in local storage
        try {
          const docSnap = await getDoc(doc(db, 'userAccounts', cleanId));
          if (docSnap.exists() && docSnap.data().passHash) {
            targetPassHash = docSnap.data().passHash;
            // Cache locally
            accounts[cleanId] = docSnap.data();
            localStorage.setItem('local_vault_accounts', JSON.stringify(accounts));
          }
        } catch (e) {
          console.warn('Could not fetch userAccount from Firestore:', e);
        }
      }

      if (targetPassHash) {
        const computedHash = await hashString(pass, cleanId);
        if (computedHash === targetPassHash) {
          const localUser: VaultUser = {
            uid: `local_${cleanId}`,
            email: `${cleanId}@vault.local`,
            isLocal: true,
          };
          localStorage.setItem('current_local_vault_user', JSON.stringify(localUser));
          notifyAuthListeners(localUser);
          return localUser;
        }
      }
    }
    throw err;
  }
}

export async function loginWithGoogle(): Promise<VaultUser> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
}

export async function logoutUser(): Promise<void> {
  localStorage.removeItem('current_local_vault_user');
  notifyAuthListeners(null);
  try {
    await signOut(auth);
  } catch (e) {}
}

export async function resetAccountPassword(rawUserId: string, newPass: string): Promise<boolean> {
  const cleanId = rawUserId.toLowerCase().trim();
  const accountsRaw = localStorage.getItem('local_vault_accounts') || '{}';
  const accounts = JSON.parse(accountsRaw);

  const passHash = await hashString(newPass, cleanId);
  const updatedData = {
    userId: cleanId,
    passHash,
    updatedAt: new Date().toISOString(),
  };
  accounts[cleanId] = updatedData;
  localStorage.setItem('local_vault_accounts', JSON.stringify(accounts));

  try {
    await setDoc(doc(db, 'userAccounts', cleanId), updatedData, { merge: true });
  } catch (e) {
    console.warn('Could not update reset pass in Firestore:', e);
  }
  return true;
}

// --- FIRESTORE VAULT STORAGE ---

export async function fetchUserVaultData(userId: string): Promise<EncryptedVaultData | null> {
  if (!userId) {
    return null;
  }
  try {
    const docRef = doc(db, 'userVaults', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as EncryptedVaultData;
    }
    // Check fallback location /users/{userId}
    const legacyDocRef = doc(db, 'users', userId);
    const legacyDocSnap = await getDoc(legacyDocRef);
    if (legacyDocSnap.exists()) {
      return legacyDocSnap.data() as EncryptedVaultData;
    }
  } catch (err: any) {
    console.error('Error fetching Firestore user vault:', err);
  }
  return null;
}

export async function saveUserVaultData(userId: string, vault: EncryptedVaultData): Promise<boolean> {
  if (!userId) {
    return true;
  }
  try {
    vault.updatedAt = new Date().toISOString();
    const docRef = doc(db, 'userVaults', userId);
    await setDoc(docRef, vault, { merge: true });
    // Also mirror to legacy doc location for backward compatibility
    try {
      await setDoc(doc(db, 'users', userId), vault, { merge: true });
    } catch (e) {}
    return true;
  } catch (err: any) {
    console.error('Error saving Firestore user vault:', err);
    return false;
  }
}

// --- FIRESTORE LOGS STORAGE ---

export async function fetchUserActivityLogs(userId: string): Promise<ActivityLog[]> {
  if (!userId || userId.startsWith('local_') || !auth.currentUser || auth.currentUser.uid !== userId) {
    try {
      const localLogs = localStorage.getItem(`activity_logs_${userId}`);
      if (localLogs) return JSON.parse(localLogs);
    } catch (e) {}
    return [];
  }
  try {
    const logsRef = collection(db, 'users', userId, 'activityLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);
    const logs: ActivityLog[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
    });
    return logs;
  } catch (err: any) {
    if (err?.code !== 'permission-denied' && !err?.message?.includes('permissions')) {
      console.error('Error fetching user activity logs:', err);
    }
    return [];
  }
}

export async function addUserActivityLog(
  userId: string,
  action: string,
  details = '',
  category: 'auth' | 'account' | 'security' | 'backup' | 'system' = 'system'
) {
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action,
    details,
    category,
    timestamp: new Date().toISOString(),
  };

  try {
    const key = `activity_logs_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(newLog);
    if (existing.length > 100) existing.pop();
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (e) {}

  if (!userId || userId.startsWith('local_') || !auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }

  try {
    const logsRef = collection(db, 'users', userId, 'activityLogs');
    await addDoc(logsRef, {
      action,
      details,
      category,
      timestamp: newLog.timestamp,
    });
  } catch (err: any) {
    if (err?.code !== 'permission-denied' && !err?.message?.includes('permissions')) {
      console.error('Error adding user activity log:', err);
    }
  }
}

export async function clearUserActivityLogs(userId: string): Promise<boolean> {
  try {
    localStorage.removeItem(`activity_logs_${userId}`);
  } catch (e) {}

  if (!userId || userId.startsWith('local_') || !auth.currentUser || auth.currentUser.uid !== userId) {
    return true;
  }

  try {
    const logsRef = collection(db, 'users', userId, 'activityLogs');
    const querySnapshot = await getDocs(logsRef);
    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    return true;
  } catch (err: any) {
    if (err?.code !== 'permission-denied' && !err?.message?.includes('permissions')) {
      console.error('Error clearing activity logs:', err);
    }
    return false;
  }
}
