import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCBHLavC970AjAPPEmYj0y1DnGq3PyGcb4',
  authDomain: 'my-web-c89f3.firebaseapp.com',
  projectId: 'my-web-c89f3',
  storageBucket: 'my-web-c89f3.firebasestorage.app',
  messagingSenderId: '428941478385',
  appId: '1:428941478385:web:556a0b3e92deb374271c50',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
