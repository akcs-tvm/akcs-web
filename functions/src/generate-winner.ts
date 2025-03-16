import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, getApp } from "firebase-admin/app";
import { getRemoteConfig, RemoteConfigTemplate } from "firebase-admin/remote-config";

// Initialize Firebase only if it hasn't been initialized already
try {
  getApp();
  console.log("Firebase app is already initialized.");
} catch (error) {
  initializeApp();
  console.log("Firebase app initialized successfully.");
}

// Define types
interface Config {
  start_range: number;
  end_range: number;
  excluded_numbers: number[];
}

interface User {
  CSP_Memb_No: number;
  Name: string;
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
      const configString = typeof inAppDefaultValue === 'string' ? inAppDefaultValue : "{}";
      config = JSON.parse(configString);
    }

    return config;
  } catch (error) {
    console.error("❌ Error fetching config from Remote Config:", error);
    return null;
  }
}

// Function to generate random number
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

// Function to update winners in Remote Config
async function updateWinners(winners: Winner[]) {
  try {
    const remoteConfig = getRemoteConfig();
    const template: RemoteConfigTemplate = await remoteConfig.getTemplate();

    template.parameters['winners'] = {
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

    template.parameters['config'] = {
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
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const config = await fetchConfig();
    if (!config) {
      res.status(500).json({ error: "Config not found in Remote Config" });
      return;
    }

    const { start_range, end_range, excluded_numbers } = config;
    const data: User[] = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      res.status(400).json({ error: "Invalid user data in the request body" });
      return;
    }

    const template = await getRemoteConfig().getTemplate();
    const winnersParam = template.parameters['winners'];

    const winners: Winner[] = winnersParam && winnersParam.defaultValue ?
      ("value" in winnersParam.defaultValue ?
        JSON.parse(winnersParam.defaultValue.value || "[]") :
        ("inAppDefaultValue" in winnersParam.defaultValue ?
          typeof winnersParam.defaultValue.inAppDefaultValue === 'string' ? JSON.parse(winnersParam.defaultValue.inAppDefaultValue) : [] :
          [])) :
      [];

    const randomNumber = await generateRandomNumber(start_range, end_range, excluded_numbers);
    const user = data.find((row) => row.CSP_Memb_No === randomNumber);

    if (!user) {
      res.status(404).json({ error: "No user found with the generated number" });
      return;
    }

    const newWinner: Winner = {
      month: new Date().toLocaleString("default", { month: "long" }),
      year: new Date().getFullYear(),
      name: user.Name || "Unknown",
      number: randomNumber,
    };

    winners.push(newWinner);
    await updateWinners(winners);

    config.excluded_numbers.push(randomNumber);
    await updateConfig(config);

    res.json(newWinner);
  } catch (error) {
    console.error("❌ Error in generate new winner:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
});