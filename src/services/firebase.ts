import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ThresholdSettings, LogEntry, AlertItem } from '../types/smce';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with explicit databaseId per platform specification
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check on boot per Firebase skill guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or network is disconnected.');
    }
    return false;
  }
}

// Execute connection test silently
testConnection();

// Authentication APIs
export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (err: any) {
    console.error('Google Sign-In failed:', err);
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// User Profile sync
export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  try {
    await setDoc(
      userRef,
      {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'SMCE Operator',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Threshold Settings cloud persistence
export async function saveThresholdSettingsToCloud(
  userId: string,
  settings: ThresholdSettings
): Promise<void> {
  const path = `users/${userId}/settings/current`;
  const settingRef = doc(db, 'users', userId, 'settings', 'current');
  try {
    await setDoc(
      settingRef,
      {
        userId,
        stationName: settings.stationName,
        altitudeMeters: settings.altitudeMeters,
        minEquipmentTemp: settings.minEquipmentTemp,
        maxEquipmentTemp: settings.maxEquipmentTemp,
        minBatteryTemp: settings.minBatteryTemp,
        maxBatteryTemp: settings.maxBatteryTemp,
        maxHumidity: settings.maxHumidity,
        minPressure: settings.minPressure,
        maxPressure: settings.maxPressure,
        minBatteryVoltage: settings.minBatteryVoltage,
        maxBatteryVoltage: settings.maxBatteryVoltage,
        maxCurrent: settings.maxCurrent,
        heaterAutoThreshold: settings.heaterAutoThreshold,
        heaterHysteresis: settings.heaterHysteresis,
        soundAlertsEnabled: settings.soundAlertsEnabled,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function loadThresholdSettingsFromCloud(
  userId: string
): Promise<ThresholdSettings | null> {
  const path = `users/${userId}/settings/current`;
  const settingRef = doc(db, 'users', userId, 'settings', 'current');
  try {
    const snap = await getDoc(settingRef);
    if (snap.exists()) {
      return snap.data() as ThresholdSettings;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

// Cloud Telemetry Logs
export async function saveTelemetryLogToCloud(userId: string, log: LogEntry): Promise<void> {
  const cleanId = log.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/logs/${cleanId}`;
  const logRef = doc(db, 'users', userId, 'logs', cleanId);
  try {
    await setDoc(logRef, {
      id: cleanId,
      userId,
      timestamp: log.timestamp,
      displayTime: log.displayTime,
      temperature: log.temperature,
      batteryTemp: log.batteryTemp,
      humidity: log.humidity,
      pressure: log.pressure,
      voltage: log.voltage,
      current: log.current,
      heater: log.heater,
      status: log.status,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Cloud Alerts
export async function saveAlertToCloud(userId: string, alert: AlertItem): Promise<void> {
  const cleanId = alert.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/alerts/${cleanId}`;
  const alertRef = doc(db, 'users', userId, 'alerts', cleanId);
  try {
    await setDoc(alertRef, {
      id: cleanId,
      userId,
      timestamp: alert.timestamp,
      displayTime: alert.displayTime,
      type: alert.type,
      sensor: alert.sensor,
      value: alert.value || '',
      status: alert.status || '',
      message: alert.message,
      acknowledged: Boolean(alert.acknowledged),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Subscriptions
export function subscribeToUserLogs(
  userId: string,
  onUpdate: (logs: LogEntry[]) => void,
  onError?: (err: unknown) => void
) {
  const path = `users/${userId}/logs`;
  const q = query(collection(db, 'users', userId, 'logs'), orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: LogEntry[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: data.id,
          timestamp: data.timestamp,
          displayTime: data.displayTime,
          temperature: data.temperature,
          batteryTemp: data.batteryTemp,
          humidity: data.humidity,
          pressure: data.pressure,
          voltage: data.voltage,
          current: data.current,
          heater: data.heater,
          status: data.status,
        });
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError?.(error);
    }
  );
}

export function subscribeToUserAlerts(
  userId: string,
  onUpdate: (alerts: AlertItem[]) => void,
  onError?: (err: unknown) => void
) {
  const path = `users/${userId}/alerts`;
  const q = query(collection(db, 'users', userId, 'alerts'), orderBy('timestamp', 'desc'), limit(30));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: AlertItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: data.id,
          timestamp: data.timestamp,
          displayTime: data.displayTime,
          type: data.type,
          sensor: data.sensor,
          value: data.value,
          status: data.status,
          message: data.message,
          acknowledged: data.acknowledged,
        });
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError?.(error);
    }
  );
}
