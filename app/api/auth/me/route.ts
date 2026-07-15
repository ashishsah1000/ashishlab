import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_unsafe_secret";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    return NextResponse.json({ user: verified.payload });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
