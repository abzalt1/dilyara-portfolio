const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const DATA_JSON_PATH = path.join(__dirname, '../public/data.json');
const TEMP_DIR = path.join(__dirname, '../temp_videos');
const OPTIMIZED_DIR = path.join(__dirname, '../public/optimized_videos');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);
if (!fs.existsSync(OPTIMIZED_DIR)) fs.mkdirSync(OPTIMIZED_DIR);

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(dest)) {
            console.log(`Already downloaded: ${dest}`);
            return resolve();
        }
        console.log(`Downloading ${url}...`);
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function optimizeVideos() {
    const data = JSON.parse(fs.readFileSync(DATA_JSON_PATH, 'utf8'));
    const videos = data.videos;

    for (const video of videos) {
        if (!video.src) continue;
        
        const url = video.src;
        const filename = path.basename(new URL(url).pathname);
        const tempPath = path.join(TEMP_DIR, filename);
        
        const ext = path.extname(filename);
        const basename = path.basename(filename, ext);
        const optimizedPath = path.join(OPTIMIZED_DIR, basename + '.mp4');

        try {
            await downloadFile(url, tempPath);
            
            if (fs.existsSync(optimizedPath)) {
                console.log(`Already optimized: ${optimizedPath}`);
                continue;
            }

            console.log(`Optimizing ${filename}...`);
            const cmd = `./ffmpeg -i "${tempPath}" -vcodec libx264 -crf 23 -preset fast -movflags +faststart -c:a aac -b:a 128k -y "${optimizedPath}"`;
            console.log(`Running: ${cmd}`);
            
            execSync(cmd, { stdio: 'inherit' });
            console.log(`Finished optimizing ${filename}\n`);
        } catch (error) {
            console.error(`Error processing ${filename}:`, error);
        }
    }
    
    console.log('All videos processed!');
}

optimizeVideos().catch(console.error);
