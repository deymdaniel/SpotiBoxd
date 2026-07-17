"use server";

import { db } from "@/lib/db";
import { signJWT, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

// Standard return type for Server Actions to relay status to the forms
export interface ActionResponse {
  success: boolean;
  error?: string;
}

/**
 * Server Action to register a new user.
 * Explaining: We check for unique email/username. If valid, we hash the password with bcryptjs (10 rounds).
 * We automatically assign the ADMIN role if the email ends with @spotiboxd.com or username is 'admin'.
 * Finally, we sign a JWT and save it to a session cookie.
 */
export async function signUpAction(formData: FormData): Promise<ActionResponse> {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!email || !username || !password) {
    return { success: false, error: "All fields are required." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  try {
    // Check if the username or email is already registered in PostgreSQL
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ],
      },
    });

    if (existingUser) {
      return { success: false, error: "Username or email is already registered." };
    }

    // Hash the password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // Auto-assign ADMIN role if email ends with "@spotiboxd.com" or username is "admin"
    const role = (email.toLowerCase().endsWith("@spotiboxd.com") || username.toLowerCase() === "admin")
      ? "ADMIN"
      : "USER";

    // Create the User record in PostgreSQL
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        username: username,
        passwordHash,
        role,
      },
    });

    // Sign the custom session JWT token
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Save session in HttpOnly cookie
    await setSessionCookie(token);

    return { success: true };
  } catch (error) {
    console.error("Signup Action error:", error);
    return { success: false, error: "Database error occurred during signup." };
  }
}

/**
 * Server Action to authenticate a logging-in user.
 * Explaining: We look up the user by email or username, then verify the password using bcrypt.compare.
 * If credentials match, we sign a JWT and set the HTTP-only secure cookie.
 */
export async function loginAction(formData: FormData): Promise<ActionResponse> {
  const identifier = formData.get("identifier") as string; // Email or Username
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { success: false, error: "Username/Email and password are required." };
  }

  try {
    // Query Postgres for user matching the username or email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier }
        ],
      },
    });

    if (!user) {
      return { success: false, error: "Invalid username/email or password." };
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid username/email or password." };
    }

    // Sign JWT token
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Set cookie
    await setSessionCookie(token);

    return { success: true };
  } catch (error) {
    console.error("Login Action error:", error);
    return { success: false, error: "Database error occurred during login." };
  }
}

/**
 * Server Action to log out the user by deleting their session cookie.
 */
export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
