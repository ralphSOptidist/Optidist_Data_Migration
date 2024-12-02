import { sourceDatabase, targetDatabase } from "./data-source";
import dotenv from "dotenv";
import { runScripts } from "./scripts";

async function copyData() {
  dotenv.config();

  console.log("Both databases connected: ", process.env.TO_DB_NAME);
  await sourceDatabase.initialize();
  console.log("Connected with source DB");
  await targetDatabase.initialize();
  console.log("Connected with target DB");

  console.log("Running scripts");
  await runScripts();
}

copyData();
