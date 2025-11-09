import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getRemoteConfig, RemoteConfigTemplate } from "firebase-admin/remote-config";

// Initialize Firebase only if not already initialized
try {
  getApp();
  console.log("✅ Firebase app is already initialized.");
} catch (error) {
  initializeApp();
  console.log("✅ Firebase app initialized successfully.");
}

// Initialize Firestore
const db = getFirestore();

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

// Function to fetch configuration from Remote Config
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

// Function to generate a random number excluding certain numbers
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

// Function to fetch user data from Firestore using CSP_Memb_No as the document ID
async function getUserFromFirestore(cspNumber: number) {
  try {
    const userDocRef = db.collection("csp-tvm-2026").doc(String(cspNumber));
    console.log("📌 Document Reference:", userDocRef.path); // Logs the Firestore path

    const userDoc = await userDocRef.get();
    console.log("📌 Firestore Document Snapshot:", userDoc); // Logs the snapshot object

    if (!userDoc.exists) {
      console.error(`❌ No Firestore user found for CSP_Memb_No: ${cspNumber}`);
      return null;
    }

    const userData = userDoc.data();
    console.log("📌 Firestore Document Data:", userData); // Logs the actual data
    return userData;
  } catch (error) {
    console.error("❌ Error fetching user from Firestore:", error);
    return null;
  }
}

// Function to update winners in Remote Config
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

// Function to update config in Remote Config
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

// Firebase Function to handle winner generation (without Express)
export const generateWinner = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    // Fetch the configuration from Remote Config
    const config = await fetchConfig();
    if (!config) {
      res.status(500).json({ error: "Config not found in Remote Config" });
      return;
    }

    const { start_range, end_range, excluded_numbers } = config;

    // Generate a random number that is not in the excluded list
    const randomNumber = await generateRandomNumber(start_range, end_range, excluded_numbers);
    console.log(`🎯 Generated Random CSP Number: ${randomNumber}`);

    // Fetch user details from Firestore
    const user = await getUserFromFirestore(randomNumber);

    if (!user) {
      res.status(404).json({ error: "No user found in Firestore with the generated CSP number" });
      return;
    }

    // Create a new winner entry with Firestore data
    const newWinner: Winner = {
      month: new Date().toLocaleString("default", { month: "long" }),
      year: new Date().getFullYear(),
      name: user.name || "Unknown",
      number: randomNumber,
    };

    console.log("🏆 New Winner:", newWinner);

    // Fetch existing winners from Remote Config
    const template = await getRemoteConfig().getTemplate();
    const winnersParam = template.parameters["winners"];
    const winners: Winner[] = winnersParam && winnersParam.defaultValue
      ? ("value" in winnersParam.defaultValue
          ? JSON.parse(winnersParam.defaultValue.value || "[]")
          : [])
      : [];

    // Add the new winner
    winners.push(newWinner);
    await updateWinners(winners);

    // Update the excluded numbers list
    config.excluded_numbers.push(randomNumber);
    await updateConfig(config);

    res.json(newWinner);
  } catch (error) {
    console.error("❌ Error in generating a new winner:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
});
