import fs from "fs";
import path from "path";

export function loadContract() {
  const contractPath = path.resolve(
    process.cwd(),
    "../contracts/ruach-course.contract.json"
  );

  if (!fs.existsSync(contractPath)) {
    throw new Error(`Contract not found at ${contractPath}`);
  }

  return JSON.parse(fs.readFileSync(contractPath, "utf-8"));
}
