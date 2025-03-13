"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation on load
    setIsVisible(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative">
      {/* Background animation */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-50 animate-pulse"
        aria-hidden="true"
      ></div>

      {/* Maintenance message container */}
      <div
        className={`${
          isVisible ? "opacity-100" : "opacity-0"
        } transition-opacity duration-1000 ease-in-out z-10 relative`}
      >
        <h1 className="text-5xl text-white font-bold animate-pulse mb-6">
          Maintenance in Progress
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          We&apos;re currently working on some updates. Please check back soon.
        </p>
        
        <div className="animate-bounce">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
