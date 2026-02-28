import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Path to to data.json
const dataFilePath = path.join(process.cwd(), "public", "data.json");

/**
 * GET /api/data
 * Returns the current data.json
 */
export async function GET() {
    try {
        const fileContents = await fs.readFile(dataFilePath, "utf8");
        const data = JSON.parse(fileContents);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error reading data.json:", error);
        return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
    }
}

/**
 * POST /api/data
 * Overwrites data.json to persist admin changes
 * Requires a bearer token (simulated for basic security)
 */
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");

        // Antigravity Rule 2: Security Boundaries - Never hardcode real secrets.
        // Using a simple check for this demo portfolio or referencing ENV.
        const secret = process.env.ADMIN_SECRET || "antigravity-secret-key";

        if (!authHeader || authHeader !== `Bearer ${secret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const newData = await req.json();

        // Validate basic structure
        if (!newData.photos || !newData.videos) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        await fs.writeFile(dataFilePath, JSON.stringify(newData, null, 2), "utf8");

        return NextResponse.json({ success: true, message: "Data updated successfully" });
    } catch (error) {
        console.error("Error writing data.json:", error);
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
    }
}
