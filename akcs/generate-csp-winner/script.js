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

// 🔁 Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // if already initialized, use that one
}

const auth = firebase.auth();

document.getElementById('getRandomNumber').addEventListener('click', async () => {
    try {
        // 🔍 Check if user is already signed in
        let user = auth.currentUser;

        if (!user) {
            // 👇 Prompt user for email & password if not signed in
            const email = prompt("Enter your email:");
            const password = prompt("Enter your password:");

            if (!email || !password) {
                alert("Email and password are required!");
                return;
            }

            // 🔐 Sign in with Firebase
            const result = await auth.signInWithEmailAndPassword(email, password);
            user = result.user;
            console.log("Signed in as:", user.email);
        }

        // 🪪 Get Firebase token
        const token = await user.getIdToken();

        // Hide button and heading
        document.getElementById('getRandomNumber').style.display = 'none';
        document.getElementById('mainHeading').style.display = 'none';

        // Show countdown
        const countdownElement = document.getElementById('countdown');
        countdownElement.innerText = '5';
        countdownElement.style.display = 'block';

        for (let i = 4; i >= 1; i--) {
            await delay(1000); // Delay for 1 second
            countdownElement.innerText = i;
        }

        await delay(1000); // Extra delay
        countdownElement.style.display = 'none';

        // ✅ Make API POST request with Firebase token
        const response = await fetch('https://generatewinnerfunction-62y63fuseq-uc.a.run.app', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // 👈 Secure access
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch winner');
        }

        const data = await response.json();

        if (!data.month || !data.year || !data.name || !data.number) {
            throw new Error("Invalid response format");
        }

        // ✅ Display result correctly
        const resultElement = document.getElementById('result');
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

// ⏱ Delay helper
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
