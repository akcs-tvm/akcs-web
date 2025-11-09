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
  
  // ✅ Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  } else {
    firebase.app();
  }
  
  const auth = firebase.auth();
  
  // 👇 Get UI elements
  const button = document.getElementById('getRandomNumber');
  const heading = document.getElementById('mainHeading');
  const countdownElement = document.getElementById('countdown');
  const resultElement = document.getElementById('result');
  
  // ✅ Delay helper
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  button.addEventListener('click', async () => {
    try {
      const user = auth.currentUser;
  
      // 🔐 Not signed in? Redirect to login with redirect param
      if (!user) {
        const redirectPath = window.location.pathname;
        const loginURL = `/login-page/index.html?redirect=${encodeURIComponent(redirectPath)}`;
        console.log("Redirecting unauthenticated user to:", loginURL);
        window.location.href = loginURL;
        return;
      }
  
      const token = await user.getIdToken();
  
      // 👀 Hide UI
      button.style.display = 'none';
      heading.style.display = 'none';
  
      // ⏱ Show countdown
      countdownElement.innerText = '5';
      countdownElement.style.display = 'block';
  
      for (let i = 4; i >= 1; i--) {
        await delay(1000);
        countdownElement.innerText = i;
      }
  
      await delay(1000);
      countdownElement.style.display = 'none';
  
      // 🚀 Call the protected API
      const response = await fetch('https://generatewinnerfunction-62y63fuseq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch winner');
      }
  
      const data = await response.json();
  
      if (!data.month || !data.year || !data.name || !data.number) {
        throw new Error("Invalid response format");
      }
  
      // ✅ Show Result
      resultElement.innerHTML = `
        <h2 id="header" style="color: #ffffff; font-size: 40px;">${data.month} ${data.year} Winner</h2>
        <p id="randomNumber" class="result-item"><span id="displayNumber">${data.number}</span></p>
        <p id="name" class="result-item"><span id="Name">${data.name}</span></p>
      `;
      resultElement.style.display = 'block';
  
    } catch (error) {
      console.error('Error:', error.message);
      alert(`Error: ${error.message}`);
    }
  });
  