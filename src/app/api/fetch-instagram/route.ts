import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { url } = await req.json();
        const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
        const api_key = process.env.CLOUDINARY_API_KEY;
        const api_secret = process.env.CLOUDINARY_API_SECRET;

        if (!url) return new NextResponse("Missing url", { status: 400 });

        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }
        });
        const html = await response.text();

        const match = html.match(/<meta property="og:image" content="([^"]+)"/);
        let imageUrl = match ? match[1] : null;
        if (imageUrl) imageUrl = imageUrl.replace(/&amp;/g, "&");

        if (!imageUrl) return NextResponse.json({ error: "Image not found" }, { status: 404 });

        const timestamp = Math.round(new Date().getTime() / 1000);
        const paramsToSign = `timestamp=${timestamp}${api_secret}`;
        const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

        const formData = new URLSearchParams();
        formData.append("file", imageUrl);
        if (api_key) formData.append("api_key", api_key);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
            method: "POST",
            body: formData
        });
        const uploadData = await uploadRes.json();

        if (uploadData.secure_url) {
            return NextResponse.json({ url: uploadData.secure_url });
        } else {
            return NextResponse.json({ error: "Cloudinary upload failed", details: uploadData }, { status: 500 });
        }

    } catch (error) {
        console.error(error);
        return new NextResponse(String(error), { status: 500 });
    }
}
