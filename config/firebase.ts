import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBUOGxIXry44fniCOacVUnOyF2-uwRr2Ec",
  authDomain: "udara-323a8.firebaseapp.com",
  projectId: "udara-323a8",
  storageBucket: "udara-323a8.firebasestorage.app",
  messagingSenderId: "194205062169",
  appId: "1:194205062169:web:b6851174d81c384e5fc688",
  measurementId: "G-0QWNTKPSJZ"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
