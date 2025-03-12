import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define file paths
const winnersPath = path.join(process.cwd(), "src/data", "winners.json");

console.log("🔹 Winners Path:", winnersPath);

// ✅ Ensure `winners.json` exists & is readable
function readWinners() {
  if (!fs.existsSync(winnersPath)) {
    console.warn("⚠️ winners.json not found. Creating a new one...");
    fs.writeFileSync(winnersPath, JSON.stringify([], null, 2), "utf-8");
    return [];
  }

  try {
    const data = fs.readFileSync(winnersPath, "utf-8");
    console.log("✅ Loaded winners.json successfully.");
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ Error reading winners.json. Resetting file.", error);
    fs.writeFileSync(winnersPath, JSON.stringify([], null, 2), "utf-8");
    return [];
  }
}

// ✅ API Route Handler for GET (Fetch latest available winner)
export async function GET() {
  try {
    console.log("🚀 API called: GET /api/get-winner");

    // Read winners data
    const winners = readWinners();

    // If there are no winners yet, return a message
    if (winners.length === 0) {
      console.log("🔄 No winners available yet.");
      return NextResponse.json({ message: "No winners available yet." });  // Inform the frontend there are no winners yet
    }

    // Get the latest winner (last element in the array)
    const latestWinner = winners[winners.length - 1];
    console.log("✅ Latest winner:", latestWinner);

    return NextResponse.json(latestWinner);  // Return the latest winner

  } catch (error: any) {
    console.error("❌ Error in GET handler:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
