import { NextResponse } from "next/server";
import { verifyAuthToken, unauthorizedResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
        return unauthorizedResponse();
    }

    return NextResponse.json({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY
    });
}
