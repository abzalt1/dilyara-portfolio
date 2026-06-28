import { NextResponse } from "next/server";
import { verifyAuthToken, unauthorizedResponse } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const dynamic = "force-dynamic";

const R2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.R2_BUCKET || "portfolio-media";
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || "https://pub-4288a2bf7b6345c488d13d1481543425.r2.dev";

/**
 * GET /api/sign-upload
 * Generates a Cloudflare R2 presigned URL for secure direct client uploads.
 * Query params: ?filename=photo.jpg&contentType=image/jpeg
 */
export async function GET(req: Request) {
    try {
        if (!verifyAuthToken(req)) {
            return unauthorizedResponse();
        }

        const url = new URL(req.url);
        let filename = url.searchParams.get("filename") || "unnamed";
        const contentType = url.searchParams.get("contentType") || "application/octet-stream";

        // Sanitize filename: remove path characters and limit length
        // This prevents many common S3 signature errors with weird characters
        filename = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        if (filename.length > 100) filename = filename.slice(-100);

        // Generate a unique key to avoid collisions
        const uniqueKey = `${Date.now()}_${filename}`;

        console.log(`[R2 SIGNING] Key: ${uniqueKey}, Type: ${contentType}`);

        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: uniqueKey,
            ContentType: contentType,
        });

        const presignedUrl = await getSignedUrl(R2, command, { expiresIn: 600 }); // 10 minutes

        return NextResponse.json({
            uploadUrl: presignedUrl,
            publicUrl: `${PUBLIC_DOMAIN}/${uniqueKey}`,
        });

    } catch (error: unknown) {
        console.error("Error generating presigned URL:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
