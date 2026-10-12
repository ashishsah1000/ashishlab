import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_unsafe_secret";

export interface SessionUser {
  userId: number;
  username: string;
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const payload = verified.payload as any;
    if (!payload || !payload.userId) return null;
    return {
      userId: Number(payload.userId),
      username: String(payload.username || ""),
    };
  } catch (e) {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch (e) {
    return null;
  }
}

export async function getAuthUserFromRequest(request: NextRequest): Promise<SessionUser | null> {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch (e) {
    return null;
  }
}
