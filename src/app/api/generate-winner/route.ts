// /src/pages/api/get-winner/generate.ts

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import readline from "readline";

// Define file paths
const configPath = path.join(process.cwd(), "src/data", "config.json");
const dataPath = path.join(process.cwd(), "src/data", "data.csv");
const winnersPath = path.join(process.cwd(), "src/data", "winners.json");

function readConfig() {
  if (!fs.existsSync(configPath)) {
    console.error("❌ Config file not found.");
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (error) {
    console.error("❌ Error reading config.json:", error);
    return null;
  }
}

function readCSV() {
  return new Promise<{ CSP_Memb_No: number; Name: string }[]>((resolve, reject) => {
    if (!fs.existsSync(dataPath)) {
      reject(new Error("CSV file not found"));
      return;
    }

    const results: { CSP_Memb_No: number; Name: string }[] = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(dataPath),
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
      const columns = line.split(",");
      if (columns.length >= 2) {
        const CSP_Memb_No = parseInt(columns[0].trim(), 10);
        const Name = columns[1].trim();
        if (!isNaN(CSP_Memb_No)) {
          results.push({ CSP_Memb_No, Name });
        }
      }
    });

    rl.on("close", () => {
      resolve(results);
    });

    rl.on("error", (error) => {
      reject(error);
    });
  });
}

async function generateRandomNumber(start: number, end: number, exclude: number[]) {
  const possibleNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i).filter(
    (num) => !exclude.includes(num)
  );

  if (possibleNumbers.length === 0) {
    throw new Error("No numbers left after exclusion.");
  }

  const randomIndex = Math.floor(Math.random() * possibleNumbers.length);
  return possibleNumbers[randomIndex];
}

function writeWinners(winners: any) {
  fs.writeFileSync(winnersPath, JSON.stringify(winners, null, 2), "utf-8");
}

export async function POST() {
  try {
    const config = readConfig();
    if (!config) {
      return NextResponse.json({ error: "Config file not found" }, { status: 500 });
    }

    const { start_range, end_range, excluded_numbers } = config;
    const data = await readCSV();
    const winners = JSON.parse(fs.readFileSync(winnersPath, "utf-8"));

    const randomNumber = await generateRandomNumber(start_range, end_range, excluded_numbers);
    const user = data.find((row) => row.CSP_Memb_No === randomNumber);

    const newWinner = { month: new Date().toLocaleString("default", { month: "long" }), year: new Date().getFullYear(), name: user?.Name || "Unknown", number: randomNumber };
    winners.push(newWinner);

    // Write updated winners to file
    writeWinners(winners);

    // Update excluded numbers in config
    config.excluded_numbers.push(randomNumber);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

    return NextResponse.json(newWinner);
  } catch (error: any) {
    console.error("❌ Error in generate new winner:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
