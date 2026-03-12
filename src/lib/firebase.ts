import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, Timestamp, doc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

export interface SavedQRCode {
  id?: string;
  url: string;
  qrCodeDataUri: string;
  title: string;
  createdAt: Timestamp | Date;
  userId?: string;
}

export async function saveQRCode(data: Omit<SavedQRCode, 'createdAt'>) {
  try {
    const docRef = await addDoc(collection(db, "qrcodes"), {
      ...data,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    return null;
  }
}

export async function getSavedQRCodes() {
  try {
    const q = query(collection(db, "qrcodes"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SavedQRCode[];
  } catch (e) {
    console.error("Error getting documents: ", e);
    return [];
  }
}

export async function deleteQRCode(id: string) {
  try {
    await deleteDoc(doc(db, "qrcodes", id));
    return true;
  } catch (e) {
    console.error("Error deleting document: ", e);
    return false;
  }
}
