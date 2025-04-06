import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getRemoteConfig, RemoteConfigTemplate } from "firebase-admin/remote-config";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase only if not already initialized
try {
  getApp();
  console.log("✅ Firebase app is already initialized.");
} catch (error) {
  initializeApp();
  console.log("✅ Firebase app initialized successfully.");
}

const db = getFirestore();
const auth = getAuth();

// Configuration
const requireAuth = true; // Toggle this to enable/disable authorization
const permissionKey = "generate-csp-winner";

// Define types
interface Config {
  start_range: number;
  end_range: number;
  excluded_numbers: number[];
}

interface Winner {
  month: string;
  year: number;
  name: string;
  number: number;
}

// ⛔ Authorization Check (optional)
async function verifyAuthorization(req: any): Promise<string | null> {
  try {
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : "";

    if (!idToken) {
      console.error("❌ Missing Firebase ID token.");
      return null;
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const permissionDoc = await db.collection("permissions").doc(uid).get();
    const permissionData = permissionDoc.data();

    if (!permissionData || permissionData[permissionKey] !== true) {
      console.error(`❌ UID ${uid} not authorized for ${permissionKey}`);
      return null;
    }

    return uid;
  } catch (error) {
    console.error("❌ Authorization failed:", error);
    return null;
  }
}

// Fetch configuration from Remote Config
async function fetchConfig(): Promise<Config | null> {
  try {
    const remoteConfig = getRemoteConfig();
    const template: RemoteConfigTemplate = await remoteConfig.getTemplate();
    const configParam = template.parameters["config"];

    if (!configParam || !configParam.defaultValue) {
      console.error("❌ Config not found in Remote Config.");
      return null;
    }

    const defaultValue = configParam.defaultValue;
    let config: Config = { start_range: 1, end_range: 100, excluded_numbers: [] };

    if ("value" in defaultValue) {
      config = JSON.parse(defaultValue.value || "{}");
    } else if ("inAppDefaultValue" in defaultValue) {
      const inAppDefaultValue = defaultValue.inAppDefaultValue;
      const configString = typeof inAppDefaultValue === "string" ? inAppDefaultValue : "{}";
      config = JSON.parse(configString);
    }

    return config;
  } catch (error) {
    console.error("❌ Error fetching config from Remote Config:", error);
    return null;
  }
}

// Generate a random number excluding specific ones
async function generateRandomNumber(start: number, end: number, exclude: number[]): Promise<number> {
  const possibleNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i).filter(
    (num) => !exclude.includes(num)
  );

  if (possibleNumbers.length === 0) {
    throw new Error("No numbers left after exclusion.");
  }

  const randomIndex = Math.floor(Math.random() * possibleNumbers.length);
  return possibleNumbers[randomIndex];
}

// Get user from Firestore using CSP_Memb_No
async function getUserFromFirestore(cspNumber: number) {
  try {
    const userDocRef = db.collection("csp-tvm-2025").doc(String(cspNumber));
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.error(`❌ No Firestore user found for CSP_Memb_No: ${cspNumber}`);
      return null;
    }

    return userDoc.data();
  } catch (error) {
    console.error("❌ Error fetching user from Firestore:", error);
    return null;
  }
}

// Update winners in Remote Config
async function updateWinners(winners: Winner[]) {
  try {
    const remoteConfig = getRemoteConfig();
    const template: RemoteConfigTemplate = await remoteConfig.getTemplate();

    template.parameters["winners"] = {
      defaultValue: {
        value: JSON.stringify(winners),
      },
    };

    await remoteConfig.publishTemplate(template);
    console.log("✅ Winners updated in Remote Config.");
  } catch (error) {
    console.error("❌ Error updating winners in Remote Config:", error);
  }
}

// Update config in Remote Config
async function updateConfig(config: Config) {
  try {
    const remoteConfig = getRemoteConfig();
    const template: RemoteConfigTemplate = await remoteConfig.getTemplate();

    template.parameters["config"] = {
      defaultValue: {
        value: JSON.stringify(config),
      },
    };

    await remoteConfig.publishTemplate(template);
    console.log("✅ Config updated in Remote Config.");
  } catch (error) {
    console.error("❌ Error updating config in Remote Config:", error);
  }
}

// Cloud Function Entry
export const generateWinner = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "https://akcs.in");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  if (requireAuth) {
    const uid = await verifyAuthorization(req);
    if (!uid) {
      res.status(403).json({ error: "Unauthorized access" });
      return;
    }
  }

  try {
    const config = await fetchConfig();
    if (!config) {
      res.status(500).json({ error: "Config not found in Remote Config" });
      return;
    }

    const { start_range, end_range, excluded_numbers } = config;
    const randomNumber = await generateRandomNumber(start_range, end_range, excluded_numbers);
    console.log(`🎯 Generated Random CSP Number: ${randomNumber}`);

    const user = await getUserFromFirestore(randomNumber);
    if (!user) {
      res.status(404).json({ error: "No user found in Firestore with the generated CSP number" });
      return;
    }

    const newWinner: Winner = {
      month: new Date().toLocaleString("default", { month: "long" }),
      year: new Date().getFullYear(),
      name: user.name || "Unknown",
      number: randomNumber,
    };

    console.log("🏆 New Winner:", newWinner);

    const template = await getRemoteConfig().getTemplate();
    const winnersParam = template.parameters["winners"];
    const winners: Winner[] = winnersParam && winnersParam.defaultValue
      ? ("value" in winnersParam.defaultValue
          ? JSON.parse(winnersParam.defaultValue.value || "[]")
          : [])
      : [];

    winners.push(newWinner);
    await updateWinners(winners);

    config.excluded_numbers.push(randomNumber);
    await updateConfig(config);

    res.json(newWinner);
  } catch (error) {
    console.error("❌ Error in generating a new winner:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});
