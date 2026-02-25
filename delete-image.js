const https = require('https');
const crypto = require('crypto');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { public_id } = JSON.parse(event.body);
        
        const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
        const api_key = process.env.CLOUDINARY_API_KEY;
        const api_secret = process.env.CLOUDINARY_API_SECRET;

        if (!public_id || !api_secret || !cloud_name) {
            return { statusCode: 400, body: 'Missing public_id or env vars' };
        }

        const timestamp = Math.round(new Date().getTime() / 1000);
        const signature = crypto.createHash('sha1')
            .update(`public_id=${public_id}&timestamp=${timestamp}${api_secret}`)
            .digest('hex');

        const data = new URLSearchParams({ public_id, api_key, timestamp, signature }).toString();

        const result = await new Promise((resolve, reject) => {
            const req = https.request(`https://api.cloudinary.com/v1_1/${cloud_name}/image/destroy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }, res => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve(JSON.parse(body)));
            });
            req.on('error', reject);
            req.write(data);
            req.end();
        });

        return { statusCode: 200, body: JSON.stringify(result) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: String(error) };
    }
};