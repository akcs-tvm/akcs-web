document.getElementById('getRandomNumber').addEventListener('click', async () => {
    try {
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

        // Hide countdown
        countdownElement.style.display = 'none';

        // ✅ Make API POST request
        const response = await fetch('https://generatewinnerfunction-62y63fuseq-uc.a.run.app', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch winner');
        }

        const data = await response.json(); // Ensure JSON is parsed correctly

        console.log("API Response:", data); // Debugging: Log API response

        // Ensure API response has expected fields
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

// Function to create a delay using Promises
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
