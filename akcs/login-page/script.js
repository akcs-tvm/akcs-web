import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// 🔐 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCMRH7LV6U1hSogeMDam40eq2mFBDaN3iQ",
  authDomain: "akcs-3d467.firebaseapp.com",
  projectId: "akcs-3d467",
  storageBucket: "akcs-3d467.firebasestorage.app",
  messagingSenderId: "162264045585",
  appId: "1:162264045585:web:fb9887129c93f124d939b0",
  measurementId: "G-1T6FMTEESE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 📍 Get redirect path from query string
function getRedirectPath() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  return redirect && redirect.startsWith("/") ? redirect : "/login-page/protected.html";
}

// 🔄 Auth Check
onAuthStateChanged(auth, (user) => {
  const loader = document.getElementById("loader");
  const content = document.getElementById("content");

  if (loader) loader.style.display = "none";

  if (user) {
    console.log("✅ Already logged in:", user.email);
    window.location.href = getRedirectPath();
  } else {
    if (content) content.style.display = "block";
  }
});

// 🔐 Handle Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const error = document.getElementById("error");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Login successful:", userCredential.user.email);
      window.location.href = getRedirectPath();
    } catch (err) {
      console.error("❌ Login error:", err.message);
      if (error) error.textContent = err.message;
    }
  });
}
