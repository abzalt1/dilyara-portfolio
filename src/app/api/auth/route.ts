import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        // Antigravity Rule 2: Security Boundaries - Never hardcode real secrets.
        // Reading from environment variable setup in Vercel
        const correctPassword = process.env.ADMIN_PASSWORD;
        const jwtSecret = process.env.JWT_SECRET || "fallback_secret_for_local_dev";

        if (!correctPassword) {
            console.error("ADMIN_PASSWORD is not set in environment variables");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        if (password === correctPassword) {
            // Token valid for 24 hours
            const token = jwt.sign({ role: "admin" }, jwtSecret, { expiresIn: "24h" });
            return NextResponse.json({ token, message: "Login successful" });
        } else {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }
    } catch (error) {
        console.error("Auth Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
