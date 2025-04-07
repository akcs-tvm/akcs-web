import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// ✅ Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCMRH7LV6U1hSogeMDam40eq2mFBDaN3iQ",
    authDomain: "akcs-3d467.firebaseapp.com",
    projectId: "akcs-3d467",
    storageBucket: "akcs-3d467.firebasestorage.app",
    messagingSenderId: "162264045585",
    appId: "1:162264045585:web:fb9887129c93f124d939b0",
    measurementId: "G-1T6FMTEESE"
  };

// 🔄 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🔐 Check Auth State on Page Load
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ Already logged in:", user.email);
    window.location.href = "protected.html"; // Change this to your main app
  }
});

// 🧠 Handle Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("error");

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Login successful:", userCredential.user.email);
    window.location.href = "protected.html";
  } catch (err) {
    console.error("❌ Login error:", err.message);
    error.textContent = err.message;
  }
});
