import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFilePath = path.join(__dirname, "../error_log.txt");

try {
  if (fs.existsSync(logFilePath)) {
    fs.unlinkSync(logFilePath);
    console.log("Deleted existing error_log.txt");
  }

  fs.writeFileSync(logFilePath, "");
  console.log("Created new error_log.txt");
} catch (err: any) {
  console.error("Error resetting error_log.txt:", err.message);
}
