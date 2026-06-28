const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3");

const R2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.R2_BUCKET;

async function cleanR2() {
    console.log("Listing objects in bucket...");
    const listCmd = new ListObjectsV2Command({ Bucket: BUCKET });
    const res = await R2.send(listCmd);
    
    if (!res.Contents) {
        console.log("Bucket is empty.");
        return;
    }
    
    const movFiles = res.Contents.filter(obj => obj.Key.toLowerCase().endsWith('.mov'));
    
    if (movFiles.length === 0) {
        console.log("No .mov files found to delete.");
        return;
    }
    
    console.log(`Found ${movFiles.length} .mov files. Deleting...`);
    movFiles.forEach(f => console.log(` - ${f.Key}`));
    
    const deleteCmd = new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: {
            Objects: movFiles.map(f => ({ Key: f.Key }))
        }
    });
    
    await R2.send(deleteCmd);
    console.log("✅ Successfully deleted all .mov files from R2.");
}

cleanR2().catch(console.error);
