import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { public_id } = body;

        const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
        const api_key = process.env.CLOUDINARY_API_KEY;
        const api_secret = process.env.CLOUDINARY_API_SECRET;

        if (!public_id || !api_secret || !cloud_name) {
            return new NextResponse("Missing public_id or env vars", { status: 400 });
        }

        const timestamp = Math.round(new Date().getTime() / 1000);
        const signature = crypto.createHash("sha1")
            .update(`public_id=${public_id}&timestamp=${timestamp}${api_secret}`)
            .digest("hex");

        const formData = new URLSearchParams();
        formData.append("public_id", public_id);
        if (api_key) formData.append("api_key", api_key);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);

        const destroyUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/destroy`;
        const result = await fetch(destroyUrl, {
            method: "POST",
            body: formData,
        });

        const data = await result.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return new NextResponse(String(error), { status: 500 });
    }
}
