import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Standard JWT signature key. Jose requires it as a Uint8Array.
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super_secret_session_token_key_123456789_at_least_32_chars"
);

// Type declaration for the JWT payload contents
export interface SessionPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

/**
 * Encrypts/signs user session details into a JWT token.
 * Explaining: We set the algorithm (HS256), the issue time, and set it to expire in 7 days.
 */
export async function signJWT(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Decrypts and verifies the signature of a session token.
 * Explaining: If signature validation fails or it is expired, we return null.
 */
export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Saves the session token inside an HTTP-only secure cookie named `session_token`.
 * Explaining: httpOnly: true makes it inaccessible to client-side scripts, protecting against XSS.
 * secure is enabled in production, and sameSite: 'lax' guards against CSRF.
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Removes the session cookie to log out the user.
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
}

/**
 * Helper to fetch, verify, and return the current user session.
 * Explaining: This can be imported directly in Server Components or Server Actions.
 */
export async function getSessionUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) return null;
    return await verifyJWT(token);
  } catch (e) {
    return null;
  }
}
