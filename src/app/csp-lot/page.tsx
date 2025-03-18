"use client";

import { useEffect, useState, useCallback } from "react";

// Define a type for the winner data
interface Winner {
  month: string;
  year: number;
  name: string;
  number: number;
}

export default function CspLot() {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get the previous month and year
  const getPreviousMonth = () => {
    const now = new Date();
    let previousMonth = now.getMonth() - 1;
    let year = now.getFullYear();

    if (previousMonth < 0) {
      previousMonth = 11; // December of the previous year
      year -= 1;
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];

    return { month: monthNames[previousMonth], year };
  };

  // Calculate the countdown for the next draw (which is always on the 13th of the month)
  const calculateCountdown = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let nextTriggerDate = new Date(currentYear, currentMonth, 13, 0, 34, 0); // Next draw is on the 13th of the current month

    if (now > nextTriggerDate) {
      nextTriggerDate = new Date(currentYear, currentMonth + 1, 10, 0, 0, 0); // If we're past the 13th, set next trigger date to 10th of next month
    }

    return Math.floor((nextTriggerDate.getTime() - now.getTime()) / 1000);
  };

  useEffect(() => {
    setCountdown(calculateCountdown());
    const interval = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Use useCallback to memoize the fetchWinner function and prevent unnecessary re-renders
  const fetchWinner = useCallback(async () => {
    setError(null);
    try {
      console.log("🚀 Fetching winner from API...");
      const response = await fetch("/api/get-winner");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch winner.");
      }

      console.log("✅ API Response:", data);

      const now = new Date();
      const drawDate = new Date(now.getFullYear(), now.getMonth(), 10, 0, 0, 0);

      // If before the 10th of the current month, show last month's winner
      if (now < drawDate) {
        const { month, year } = getPreviousMonth();
        const lastMonthWinner = data.find((w: Winner) => w.month === month && w.year === year);
        if (lastMonthWinner) {
          setWinner(lastMonthWinner);
          return;
        }
      }

      // Otherwise, show this month's winner
      setWinner(data);
    } catch (error: unknown) {
      setError((error as Error).message);
      console.error("❌ Error fetching winner:", error);
    }
  }, []); // Dependencies should be an empty array since we're calling this function explicitly

  // Generate a new winner once the countdown ends
  const generateNewWinner = async () => {
    try {
      console.log("🚀 Generating a new winner...");
      const response = await fetch("/api/generate-winner", {
        method: "POST", // Assuming POST method for winner generation
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate winner.");
      }

      console.log("✅ New winner generated:", data);
      setWinner(data);
    } catch (error: unknown) {
      setError((error as Error).message);
      console.error("❌ Error generating new winner:", error);
    }
  };

  useEffect(() => {
    if (countdown === 0) {
      generateNewWinner(); // Generate new winner when countdown hits 0
      setCountdown(calculateCountdown()); // Reset the countdown for the next draw
    }
  }, [countdown]);

  useEffect(() => {
    fetchWinner();
  }, [fetchWinner]); // Include fetchWinner as a dependency to prevent re-fetching on re-renders

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      {/* Winner Title */}
      <h1 className="text-4xl font-bold mb-2">
        Winner of {winner?.month ? winner.month : "Loading..."}
      </h1>

      {/* Winner Name & Number */}
      {winner ? (
        <>
          <p className="text-2xl font-semibold">{winner.name}</p>
          <p className="text-lg text-gray-600">{winner.number}</p>
        </>
      ) : error ? (
        <p className="text-xl text-red-500">{error}</p>
      ) : (
        <p className="text-xl text-gray-600">Loading winner...</p>
      )}

      {/* Countdown Timer */}
      {countdown !== null && countdown > 0 && (
        <p className="text-lg text-gray-500 mt-2">
          Next draw in: {Math.floor(countdown / 86400)} days,{" "}
          {Math.floor((countdown % 86400) / 3600)} hours,{" "}
          {Math.floor((countdown % 3600) / 60)} minutes, {countdown % 60} seconds
        </p>
      )}
    </div>
  );
}
