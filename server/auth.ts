import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Validate email domain for company restriction
function validateCompanyEmail(email: string): boolean {
  const allowedDomains = ['@magnoos.com'];
  return allowedDomains.some(domain => email.toLowerCase().endsWith(domain.toLowerCase()));
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fallback-secret-for-dev",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          // Convert email to lowercase to prevent login issues
          const lowercaseEmail = email.toLowerCase().trim();
          const user = await storage.getUserByEmail(lowercaseEmail);
          if (!user || !user.password || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (error) {
          console.error('LocalStrategy error:', error);
          return done(null, false, { message: "Database connection error" });
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('Passport deserializeUser error:', error);
      // Return null user instead of error to prevent session corruption
      done(null, false);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Convert email to lowercase to prevent login issues from auto-capitalization
      const lowercaseEmail = email.toLowerCase().trim();

      // Validate company email domain - TEMPORARILY DISABLED FOR TESTING
      // if (!validateCompanyEmail(lowercaseEmail)) {
      //   return res.status(400).json({ message: "Registration is restricted to company email addresses only" });
      // }

      // Validate role
      const validRoles = ['manager', 'pm', 'operations_ksa', 'operations_uae', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role specified" });
      }

      const existingUser = await storage.getUserByEmail(lowercaseEmail);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email: lowercaseEmail,
        password: hashedPassword,
        firstName,
        lastName,
        role, // Use the role from the signup form
        annualTravelBudget: "15000"
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          activeRole: user.activeRole
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          activeRole: user.activeRole
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as SelectUser;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      activeRole: user.activeRole
    });
  });

  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Convert email to lowercase for consistency
      const lowercaseEmail = email.toLowerCase().trim();
      
      // Check if user exists
      const user = await storage.getUserByEmail(lowercaseEmail);
      
      // For security, always return success even if user doesn't exist
      // This prevents email enumeration attacks
      if (!user) {
        return res.status(200).json({ 
          message: "If an account exists with this email, password reset instructions have been sent." 
        });
      }

      // Generate a random temporary password
      const tempPassword = randomBytes(16).toString('hex');
      const hashedTempPassword = await hashPassword(tempPassword);
      
      // Update user's password in database
      await storage.updateUserPassword(user.email, hashedTempPassword);

      // Import email service
      const { realEmailService } = await import('./realEmailService');
      
      // Send password reset email
      const emailSent = await realEmailService.sendEmail({
        to: user.email,
        subject: "Password Reset - Magnoos Travel System",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0032FF;">🔐 Password Reset Request</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p>Hello ${user.firstName},</p>
              <p>We received a request to reset your password for the Magnoos Travel Management System.</p>
              <p>Your new temporary password is:</p>
              <div style="background: white; padding: 15px; border-left: 4px solid #0032FF; margin: 15px 0;">
                <code style="font-size: 16px; font-weight: bold; color: #0032FF;">${tempPassword}</code>
              </div>
              <p><strong>Important:</strong> Please log in using this temporary password and change it immediately in your account settings.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://your-app.replit.app'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #0032FF, #8A2BE2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Access Travel Management System
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">If you did not request this password reset, please contact your administrator immediately.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from the Magnoos Travel Management System.</p>
          </div>
        `
      });

      if (!emailSent) {
        console.error('Failed to send password reset email to:', user.email);
      }

      res.status(200).json({ 
        message: "If an account exists with this email, password reset instructions have been sent." 
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user as SelectUser;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      // Verify current password
      if (!user.password || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);
      
      // Update password in database
      await storage.updateUserPassword(user.email, hashedNewPassword);

      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};