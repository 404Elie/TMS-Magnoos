import { storage } from "../server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  try {
    // Update passwords for test users
    const testUsers = [
      { email: "john.doe@magnoos.com", password: "password123" },
      { email: "jane.smith@magnoos.com", password: "password123" },
      { email: "mike.wilson@magnoos.com", password: "password123" },
      { email: "sarah.jones@magnoos.com", password: "password123" },
    ];

    for (const testUser of testUsers) {
      const hashedPassword = await hashPassword(testUser.password);
      await storage.updateUserPassword(testUser.email, hashedPassword);
      console.log(`Updated password for ${testUser.email}: ${testUser.password}`);
    }

    console.log("\nAll test user passwords have been set to: password123");
    console.log("\nAdmin login:");
    console.log("Email: admin@magnoos.com");
    console.log("Password: admin123");
    
  } catch (error) {
    console.error("Error updating user passwords:", error);
  }
}

createAdmin();