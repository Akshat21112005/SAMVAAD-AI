 
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "samvaad-ai-f942f.firebaseapp.com",
  projectId: "samvaad-ai-f942f",
  storageBucket: "samvaad-ai-f942f.firebasestorage.app",
  messagingSenderId: "1084176767723",
  appId: "1:1084176767723:web:bf9b1fb969909a34defcae"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export {auth, provider};