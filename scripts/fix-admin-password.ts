import { storage } from "../server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function fixAdminPassword() {
  try {
    const adminEmail = "admin@magnoos.com";
    const adminPassword = "admin123";

    console.log("Setting admin password...");
    const hashedPassword = await hashPassword(adminPassword);

    // Update admin password
    await storage.updateUserPassword(adminEmail, hashedPassword);

    console.log("✓ Admin password updated successfully!");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
  } catch (error) {
    console.error("Error updating admin password:", error);
  }
}

fixAdminPassword();
