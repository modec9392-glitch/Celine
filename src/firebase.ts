/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  Auth,
  User
} from 'firebase/auth';

import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth: Auth = getAuth(app);

// Error handler per guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

// Connection check
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'test-connection'));
    console.log('✅ Firebase Firestore connected successfully!');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('⚠️ Firebase Firestore client is currently offline.');
      return false;
    }
    // Any other response means server reached
    return true;
  }
}

// Global interface for window attachment
export const celineFirebase = {
  config: firebaseConfig,
  app,
  db,
  auth,

  // Auth Helpers
  onAuthChange(cb: (user: User | null) => void) {
    return onAuthStateChanged(auth, cb);
  },
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      return res.user;
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      throw err;
    }
  },
  async loginAnonymously() {
    try {
      const res = await signInAnonymously(auth);
      return res.user;
    } catch (err) {
      console.error('Anonymous Sign-In Error:', err);
      throw err;
    }
  },
  async logout() {
    return signOut(auth);
  },
  getCurrentUser() {
    return auth.currentUser;
  },

  // Products
  listenProducts(onData: (products: any[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'products');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
        if (onError) onError(error);
      }
    );
  },
  async saveProduct(product: any) {
    const id = String(product.id || 'p_' + Date.now());
    const docRef = doc(db, 'products', id);
    const data = {
      ...product,
      id,
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(docRef, data, { merge: true });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${id}`);
      throw error;
    }
  },
  async deleteProduct(id: string | number) {
    const docRef = doc(db, 'products', String(id));
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      throw error;
    }
  },
  async seedInitialProducts(defaultProducts: any[]) {
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (snap.empty && defaultProducts && defaultProducts.length > 0) {
        console.log('🌱 Seeding initial products to Firestore...');
        for (const p of defaultProducts) {
          const docRef = doc(db, 'products', String(p.id));
          await setDoc(docRef, { ...p, id: String(p.id), createdAt: new Date().toISOString() });
        }
        console.log('✅ Initial products seeded to Firestore!');
      }
    } catch (err) {
      console.warn('Seeding products note:', err);
    }
  },

  // Gallery
  listenGallery(onData: (items: any[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'gallery');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'gallery');
        if (onError) onError(error);
      }
    );
  },
  async saveGalleryItem(item: any) {
    const id = String(item.id || 'ga_' + Date.now());
    const docRef = doc(db, 'gallery', id);
    const data = { ...item, id, updatedAt: new Date().toISOString() };
    try {
      await setDoc(docRef, data, { merge: true });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `gallery/${id}`);
      throw error;
    }
  },
  async deleteGalleryItem(id: string) {
    const docRef = doc(db, 'gallery', id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
      throw error;
    }
  },

  // Collections
  listenCollections(onData: (items: any[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'collections');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'collections');
        if (onError) onError(error);
      }
    );
  },
  async saveCollection(item: any) {
    const id = String(item.id || 'col_' + Date.now());
    const docRef = doc(db, 'collections', id);
    const data = { ...item, id, updatedAt: new Date().toISOString() };
    try {
      await setDoc(docRef, data, { merge: true });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `collections/${id}`);
      throw error;
    }
  },
  async deleteCollection(id: string) {
    const docRef = doc(db, 'collections', id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `collections/${id}`);
      throw error;
    }
  },

  // Orders
  listenOrders(onData: (orders: any[]) => void) {
    const colRef = collection(db, 'orders');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );
  },
  async createOrder(orderData: any) {
    const colRef = collection(db, 'orders');
    try {
      const docRef = await addDoc(colRef, {
        ...orderData,
        status: 'nouveau',
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      throw error;
    }
  },

  // Custom Bespoke Requests
  listenCustomRequests(onData: (requests: any[]) => void) {
    const colRef = collection(db, 'custom_requests');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'custom_requests');
      }
    );
  },
  async createCustomRequest(requestData: any) {
    const colRef = collection(db, 'custom_requests');
    try {
      const docRef = await addDoc(colRef, {
        ...requestData,
        status: 'nouveau',
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'custom_requests');
      throw error;
    }
  },

  // Training Inscriptions
  listenInscriptions(onData: (inscriptions: any[]) => void) {
    const colRef = collection(db, 'inscriptions');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'inscriptions');
      }
    );
  },
  async createInscription(inscriptionData: any) {
    const colRef = collection(db, 'inscriptions');
    try {
      const docRef = await addDoc(colRef, {
        ...inscriptionData,
        status: 'nouveau',
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'inscriptions');
      throw error;
    }
  },

  // Contact Messages
  async createContactMessage(messageData: any) {
    const colRef = collection(db, 'contact_messages');
    try {
      const docRef = await addDoc(colRef, {
        ...messageData,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'contact_messages');
      throw error;
    }
  },

  // Site Settings
  listenSettings(onData: (settings: any) => void) {
    const docRef = doc(db, 'settings', 'global');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data());
      }
    });
  },
  async saveSettings(settingsData: any) {
    const docRef = doc(db, 'settings', 'global');
    try {
      await setDoc(docRef, { ...settingsData, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
      throw error;
    }
  }
};

// Auto test connection & assign to window
if (typeof window !== 'undefined') {
  (window as any).CelineFirebase = celineFirebase;
  testFirestoreConnection();
}
