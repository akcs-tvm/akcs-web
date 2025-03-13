"use client";
import { useState, useEffect } from "react";

const Countdown = () => {
  const calculateTimeLeft = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let targetDate = new Date(currentYear, currentMonth, 10, 0, 0, 0); // 10th of the month

    if (now > targetDate) {
      targetDate = new Date(currentYear, currentMonth + 1, 10, 0, 0, 0); // Move to next month's 10th if past
    }

    const difference = targetDate.getTime() - now.getTime();
    return {
      total: difference,
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // Properly initialize `error` state

  // Fetch random number when countdown hits zero
  const fetchRandomNumber = async () => {
    try {
      const response = await fetch("/api/get-random-number");
      const data = await response.json();

      if (response.ok) {
        setRandomNumber(data.randomNumber);
        setName(data.name);
        setError(null); // Reset error on success
      } else {
        setError(data.error); // Set error if API response is not OK
      }
    } catch {
      setError("Failed to fetch random number."); // Set error if there's a network or fetch issue
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const time = calculateTimeLeft();
      setTimeLeft(time);

      if (time.total <= 0) {
        clearInterval(timer);
        fetchRandomNumber(); // Trigger API call when countdown ends
      }
    }, 1000);

    return () => clearInterval(timer); // Cleanup interval on unmount
  }, []);

  return (
    <div className="text-center mt-4">
      <h2 className="text-xl font-semibold">Next Draw In:</h2>
      <p className="text-lg">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </p>

      {randomNumber && name && (
        <div className="mt-4">
          <p className="text-lg font-bold">Winner: {name} ({randomNumber})</p>
        </div>
      )}

      {/* Display error message if there is an error */}
      {error && <p className="mt-4 text-red-500">{error}</p>} 
    </div>
  );
};

export default Countdown;
