import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function writeErrorToFile(err: string) {
  const filePath = path.join(__dirname, "../error_log.txt");

  fs.appendFile(filePath, err + "\n\n", (writeErr) => {
    if (writeErr) {
      console.error("Failed to write error to file:", writeErr.message);
    } else {
      console.log("Error logged to", filePath);
    }
  });
}
