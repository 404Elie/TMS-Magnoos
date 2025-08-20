import { storage } from "../server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function setupUsers() {
  try {
    console.log("Setting up users...");

    // Create admin user
    const adminExists = await storage.getUserByEmail("admin@magnoos.com");
    if (!adminExists) {
      console.log("Creating admin user...");
      const adminPassword = await hashPassword("admin123");
      await storage.createUser({
        email: "admin@magnoos.com",
        password: adminPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        annualTravelBudget: "50000"
      });
      console.log("✓ Admin user created");
    } else {
      console.log("✓ Admin user already exists");
    }

    // Create test users
    const testUsers = [
      { email: "john.doe@magnoos.com", firstName: "John", lastName: "Doe", role: "pm" },
      { email: "jane.smith@magnoos.com", firstName: "Jane", lastName: "Smith", role: "manager" },
      { email: "mike.wilson@magnoos.com", firstName: "Mike", lastName: "Wilson", role: "operations_ksa" },
      { email: "sarah.jones@magnoos.com", firstName: "Sarah", lastName: "Jones", role: "operations_uae" },
    ];

    for (const testUser of testUsers) {
      const userExists = await storage.getUserByEmail(testUser.email);
      if (!userExists) {
        console.log(`Creating user: ${testUser.email}`);
        const hashedPassword = await hashPassword("password123");
        await storage.createUser({
          email: testUser.email,
          password: hashedPassword,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          role: testUser.role as any,
          annualTravelBudget: "15000"
        });
        console.log(`✓ Created user: ${testUser.email}`);
      } else {
        console.log(`✓ User already exists: ${testUser.email}`);
      }
    }

    console.log("\n✅ All users set up successfully!");
    console.log("\nAdmin login:");
    console.log("Email: admin@magnoos.com");
    console.log("Password: admin123");
    console.log("\nTest user login (any of these):");
    console.log("Email: jane.smith@magnoos.com (Manager role)");
    console.log("Password: password123");
    
  } catch (error) {
    console.error("Error setting up users:", error);
  }
}

setupUsers();