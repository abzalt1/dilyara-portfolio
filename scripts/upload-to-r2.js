const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const R2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.R2_BUCKET;
const dir = path.join(__dirname, "../public/optimized_videos");

async function upload() {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".mp4"));
    console.log(`Found ${files.length} videos to upload...`);

    for (const file of files) {
        console.log(`Uploading ${file}...`);
        const filePath = path.join(dir, file);
        const fileStream = fs.createReadStream(filePath);
        
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: file,
            Body: fileStream,
            ContentType: "video/mp4",
        });

        await R2.send(command);
        console.log(`✅ Uploaded ${file}`);
    }
    console.log("All uploads complete!");
}

upload().catch(console.error);
