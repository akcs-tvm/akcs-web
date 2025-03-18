import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, getApp } from "firebase-admin/app";
import { getRemoteConfig } from "firebase-admin/remote-config";
import { Request, Response } from "express";

// Initialize Firebase only if it hasn't been initialized yet
try {
  getApp();
} catch (error: unknown) {
  initializeApp();
}

// Define the Winner type
interface Winner {
  month: string;
  year: number;
  name: string;
  number: number;
}

// Fetch the list of winners from Firebase Remote Config
async function fetchWinners(): Promise<Winner[]> {
  try {
    const remoteConfig = getRemoteConfig();
    const latestTemplate = await remoteConfig.getTemplate(); // Fetch latest values

    console.log("📢 Raw Remote Config Data:", JSON.stringify(latestTemplate, null, 2));

    const winnersParamObj = latestTemplate.parameters["winners"]?.defaultValue as { value: string } | undefined;
    
    if (!winnersParamObj || !winnersParamObj.value) {
      console.warn("⚠️ 'winners' parameter is missing or empty in Remote Config.");
      return [];
    }

    const winnersParam = winnersParamObj.value;
    console.log("📜 Raw Winners String:", winnersParam);

    try {
      // Parse winners JSON
      const winners: Winner[] = JSON.parse(winnersParam);
      console.log("✅ Winners fetched:", winners);

      return winners;
    } catch (parseError) {
      console.error("❌ Error parsing winners JSON:", parseError);
      console.error("❌ Invalid JSON String:", winnersParam);
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching winners:", error);
    return [];
  }
}

// API Endpoint to Get the Latest Winner
export const getWinner = onRequest(async (req: Request, res: Response) => {
  try {
    console.log("🚀 API called: GET /get-winner");

    const winners = await fetchWinners();

    if (winners.length === 0) {
      console.log("🔄 No winners available yet.");
      res.json({ message: "No winners available yet." });
      return;
    }

    const latestWinner = winners[winners.length - 1];
    console.log("🏆 Latest winner:", latestWinner);

    res.json(latestWinner);
  } catch (error: unknown) {
    console.error("❌ Error in handler:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
});
