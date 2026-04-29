import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAjEG20ZbAMTASwq2q3Pg1ZYoN22n2EyJE",
  authDomain: "inspectlyai-519.firebaseapp.com",
  projectId: "inspectlyai-519",
  storageBucket: "inspectlyai-519.firebasestorage.app",
  messagingSenderId: "235052570382",
  appId: "1:235052570382:web:cec53d8697e3dc7948695f",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
