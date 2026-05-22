import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASiwxPsGa8_JXM89MNMpEAsVFGkGGgFvM",
  authDomain: "jireh-menu.appspot.com",
  projectId: "jireh-menu",
  storageBucket: "jireh-menu.firebasestorage.app",
  messagingSenderId: "767912600761",
  appId: "1:767912600761:web:62aca06cfc23c80c16a768"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);