import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ServiceRequest, CustomerReview, HomeProjectRequest, ComplaintRecord } from './types';

// 1. Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// 2. Error Handler with strictly conforming FirestoreErrorInfo
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

// 3. Test Connection on Boot (CRITICAL CONSTRAINT)
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('Firestore: Connected successfully to database', firebaseConfig.firestoreDatabaseId);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore: Client is offline or initializing.');
      return false;
    }
    // In many cases, document 'test/connection' won't exist or permissions deny reading 'test', which is normal
    return true;
  }
}

// Fire connection check on load
testConnection();

// 4. Firestore Helpers for UrbanCare Solution Collections
export async function persistServiceRequest(request: ServiceRequest): Promise<void> {
  const path = `service_requests/${request.id}`;
  try {
    // Sanitize payload to strip undefined values which Firestore rejects
    const sanitized = JSON.parse(JSON.stringify(request));
    await setDoc(doc(db, 'service_requests', request.id), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function persistCustomerReview(review: CustomerReview): Promise<void> {
  const path = `customer_reviews/${review.id}`;
  try {
    const sanitized = JSON.parse(JSON.stringify(review));
    await setDoc(doc(db, 'customer_reviews', review.id), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function persistHomeProject(project: HomeProjectRequest): Promise<void> {
  const path = `home_projects/${project.id}`;
  try {
    const sanitized = JSON.parse(JSON.stringify(project));
    await setDoc(doc(db, 'home_projects', project.id), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function persistComplaint(complaint: ComplaintRecord): Promise<void> {
  const path = `complaints/${complaint.id}`;
  try {
    const sanitized = JSON.parse(JSON.stringify(complaint));
    await setDoc(doc(db, 'complaints', complaint.id), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
