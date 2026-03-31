import { NextResponse } from "next/server";
import { verifyAuthToken, unauthorizedResponse } from "@/lib/auth";

const owner = process.env.GITHUB_OWNER || "abzalt1";
const repo = process.env.GITHUB_REPO || "dilyara-portfolio";
const path = "public/data.json";

/**
 * GET /api/data
 * Returns the current data.json directly from the GitHub repository to avoid stale local cache during deployments
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    if (!verifyAuthToken(req)) {
        return unauthorizedResponse();
    }

    try {
        const pat = process.env.GITHUB_PAT;
        const headers: HeadersInit = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Portfolio-Admin-App"
        };

        if (pat) {
            headers["Authorization"] = `Bearer ${pat}`;
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const response = await fetch(url, {
            headers,
            cache: "no-store" // Disable Next.js fetch caching
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error("GitHub API Error (GET):", err);
            return NextResponse.json({ error: "Failed to fetch from GitHub", details: err }, { status: response.status });
        }

        const data = await response.json();

        // Ensure content exists and decode from base64 (handling utf-8 properly)
        if (data.content) {
            const buffer = Buffer.from(data.content, "base64");
            const decodedStr = buffer.toString("utf-8");
            const jsonData = JSON.parse(decodedStr);

            return NextResponse.json({
                data: jsonData,
                sha: data.sha // Return SHA so the frontend knows it for the next PUT
            });
        }

        throw new Error("No content found in GitHub response");

    } catch (error: any) {
        console.error("Error fetching data from GitHub:", error);
        return NextResponse.json({ error: "Failed to load data", details: error.message }, { status: 500 });
    }
}

/**
 * POST /api/data
 * Overwrites data.json on GitHub using the REST API
 */
export async function POST(req: Request) {
    if (!verifyAuthToken(req)) {
        return unauthorizedResponse();
    }

    try {
        const body = await req.json();

        // Destructure payload to expect the data, precise message, and the last known SHA
        const { content, message, sha } = body;

        // Validate basic structure
        if (!content || !content.photos || !content.videos || !sha) {
            return NextResponse.json({ error: "Invalid payload format. Expected { content: {photos, videos}, message, sha }" }, { status: 400 });
        }

        const pat = process.env.GITHUB_PAT;
        if (!pat) {
            console.error("GITHUB_PAT is missing");
            return NextResponse.json({ error: "Server Configuration Error (Missing Token)" }, { status: 500 });
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

        // Encode the content to Base64 safely
        const contentStr = JSON.stringify(content, null, 2);
        const encodedContent = Buffer.from(contentStr, "utf-8").toString("base64");

        const githubPayload = {
            message: message || "Admin Panel Update",
            content: encodedContent,
            sha: sha,
            branch: "main"
        };

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Accept": "application/vnd.github.v3+json",
                "Authorization": `Bearer ${pat}`,
                "Content-Type": "application/json",
                "User-Agent": "Portfolio-Admin-App"
            },
            body: JSON.stringify(githubPayload)
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("GitHub API Error (PUT):", err);
            const errorMessage = err.message || "Failed to save to GitHub";
            return NextResponse.json({ error: errorMessage, details: err }, { status: response.status });
        }

        const responseData = await response.json();

        return NextResponse.json({
            success: true,
            message: "Data updated on GitHub successfully",
            newSha: responseData.content.sha // Return new SHA so frontend can subsequent updates
        });

    } catch (error) {
        console.error("Error writing to GitHub:", error);
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
    }
}
