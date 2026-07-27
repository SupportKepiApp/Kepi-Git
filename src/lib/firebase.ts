import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBYwyizoGkte8iD-jPkjcNud8D1S0E_Gh8",
  authDomain: "userfeedback-dfd32.firebaseapp.com",
  projectId: "userfeedback-dfd32",
  storageBucket: "userfeedback-dfd32.firebasestorage.app",
  messagingSenderId: "220213045781",
  appId: "1:220213045781:web:657ee4ddb9cfa21c563c1c",
  measurementId: "G-2B4FGYMD1B",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

isSupported()
  .then((ok) => {
    if (ok) getAnalytics(app);
  })
  .catch(() => {
    // Analytics unsupported in this environment (e.g. SSR/preview); ignore.
  });
