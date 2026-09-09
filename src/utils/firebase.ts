import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  deleteDoc, 
  getDocFromServer,
  Firestore 
} from 'firebase/firestore';
import { DashboardConfig, RegistrationRecord } from '../types';
import { DEFAULT_DASHBOARD_CONFIG } from './storage';

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0086413316",
  appId: "1:970858516623:web:68f1ee8ab56ddd885c20fa",
  apiKey: "AIzaSyACnBHnhLhdc7aHFKFMtFayKAAjiueCgi8",
  authDomain: "gen-lang-client-0086413316.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-pendaftaranpplfk-84d850dc-f156-4318-a026-e38e640df53c",
  storageBucket: "gen-lang-client-0086413316.firebasestorage.app",
  messagingSenderId: "970858516623",
  measurementId: "",
  oAuthClientId: "970858516623-ujcds79hcuu14f8vd3e8fm94v5v8nbar.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

let dbInstance: Firestore | null = null;
let isInitialized = false;

export function getFirebaseDb(): Firestore {
  if (dbInstance) return dbInstance;

  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    if (firebaseConfig.firestoreDatabaseId) {
      dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } else {
      dbInstance = getFirestore(app);
    }
    isInitialized = true;
    return dbInstance;
  } catch (error) {
    console.error("Gagal menginisialisasi Firebase Firestore:", error);
    throw error;
  }
}

/**
 * Validate Firestore connection as mandated by skill guidelines
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const db = getFirebaseDb();
    // Test fetch to confirm cloud reachability
    await getDocFromServer(doc(db, 'config', 'dashboard'));
    return true;
  } catch (error) {
    console.warn("Firestore connection check info:", error);
    return false;
  }
}

/**
 * Save DashboardConfig to Firestore
 */
export async function saveDashboardConfigToFirestore(config: DashboardConfig): Promise<boolean> {
  try {
    const db = getFirebaseDb();
    const configDocRef = doc(db, 'config', 'dashboard');
    // Ensure all undefined fields are stripped
    const cleanConfig = JSON.parse(JSON.stringify({
      ...config,
      updatedAt: new Date().toISOString()
    }));
    await setDoc(configDocRef, cleanConfig, { merge: true });
    return true;
  } catch (error) {
    console.error("Gagal menyimpan ke Firestore:", error);
    return false;
  }
}

/**
 * Load DashboardConfig from Firestore once
 */
export async function loadDashboardConfigFromFirestore(): Promise<DashboardConfig | null> {
  try {
    const db = getFirebaseDb();
    const configDocRef = doc(db, 'config', 'dashboard');
    const snap = await getDoc(configDocRef);
    if (snap.exists()) {
      const remoteData = snap.data() as Partial<DashboardConfig>;
      return {
        ...DEFAULT_DASHBOARD_CONFIG,
        ...remoteData
      };
    }
    return null;
  } catch (error) {
    console.warn("Gagal memuat konfigurasi dari Firestore:", error);
    return null;
  }
}

/**
 * Subscribe to real-time changes of DashboardConfig in Firestore
 */
export function subscribeDashboardConfig(callback: (config: DashboardConfig) => void): () => void {
  try {
    const db = getFirebaseDb();
    const configDocRef = doc(db, 'config', 'dashboard');
    
    return onSnapshot(
      configDocRef,
      (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data() as Partial<DashboardConfig>;
          callback({
            ...DEFAULT_DASHBOARD_CONFIG,
            ...remoteData
          });
        }
      },
      (error) => {
        console.warn("Real-time config listener error:", error);
      }
    );
  } catch (err) {
    console.warn("Could not attach Firestore real-time listener:", err);
    return () => {};
  }
}

/**
 * Save Registration Record to Firestore
 */
export async function saveRegistrationToFirestore(record: RegistrationRecord): Promise<boolean> {
  try {
    const db = getFirebaseDb();
    const docRef = doc(db, 'registrations', record.id);
    const cleanRecord = JSON.parse(JSON.stringify(record));
    await setDoc(docRef, cleanRecord, { merge: true });
    return true;
  } catch (error) {
    console.error("Gagal menyimpan pendaftaran ke Firestore:", error);
    return false;
  }
}

/**
 * Load all Registration Records from Firestore
 */
export async function loadRegistrationsFromFirestore(): Promise<RegistrationRecord[]> {
  try {
    const db = getFirebaseDb();
    const colRef = collection(db, 'registrations');
    const snap = await getDocs(colRef);
    const results: RegistrationRecord[] = [];
    snap.forEach((d) => {
      results.push(d.data() as RegistrationRecord);
    });
    return results;
  } catch (error) {
    console.warn("Gagal mengambil pendaftaran dari Firestore:", error);
    return [];
  }
}

/**
 * Real-time listener for registration records
 */
export function subscribeRegistrations(callback: (records: RegistrationRecord[]) => void): () => void {
  try {
    const db = getFirebaseDb();
    const colRef = collection(db, 'registrations');
    
    return onSnapshot(
      colRef,
      (snap) => {
        const records: RegistrationRecord[] = [];
        snap.forEach((d) => {
          records.push(d.data() as RegistrationRecord);
        });
        callback(records);
      },
      (error) => {
        console.warn("Real-time registrations listener error:", error);
      }
    );
  } catch (err) {
    console.warn("Could not attach Firestore registrations listener:", err);
    return () => {};
  }
}

/**
 * Delete registration record from Firestore
 */
export async function deleteRegistrationFromFirestore(id: string): Promise<boolean> {
  try {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'registrations', id));
    return true;
  } catch (error) {
    console.error("Gagal menghapus pendaftaran dari Firestore:", error);
    return false;
  }
}
