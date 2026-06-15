import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCv7Tv5-zHVs50DMdk29t9MDPsX4cb-2BQ",
  authDomain: "study-a4ca5.firebaseapp.com",
  databaseURL:
    "https://study-a4ca5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "study-a4ca5",
  storageBucket: "study-a4ca5.firebasestorage.app",
  messagingSenderId: "713632998369",
  appId: "1:713632998369:web:6b736617dc16f5d3dea8a0",
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);