import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * GET /api/sign-upload
 * Generates a Cloudinary signature for secure direct client uploads.
 */
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");

        // Simulate Basic Authentication or use a provided environment variable
        // In production, connect this to NextAuth or JWT validation
        const secret = process.env.ADMIN_SECRET || "antigravity-secret-key";

        if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader !== `Bearer ${secret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const api_secret = process.env.CLOUDINARY_API_SECRET;

        if (!api_secret) {
            return NextResponse.json({ error: "Server Configuration Error: CLOUDINARY_API_SECRET missing" }, { status: 500 });
        }

        const timestamp = Math.round(new Date().getTime() / 1000);

        const signature = crypto.createHash("sha1")
            .update(`timestamp=${timestamp}${api_secret}`)
            .digest("hex");

        return NextResponse.json({ signature, timestamp }, { status: 200 });

    } catch (error) {
        console.error("Sign-upload error:", error);
        return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
    }
}
