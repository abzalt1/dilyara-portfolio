const crypto = require('crypto');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
        }

        const { url } = body;
        const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
        const api_key = process.env.CLOUDINARY_API_KEY;
        const api_secret = process.env.CLOUDINARY_API_SECRET;

        if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'Missing url' }) };

        // Instagram is very aggressive with bot detection.
        // We try to mimic a real browser, but this is still flaky.
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        if (!response.ok) {
             console.error(`Instagram fetch failed: ${response.status} ${response.statusText}`);
             return { statusCode: response.status, body: JSON.stringify({ error: `Failed to fetch URL: ${response.statusText}` }) };
        }

        const html = await response.text();

        // Check for common blocking indicators
        if (html.includes('Login • Instagram') || html.includes('Welcome back to Instagram')) {
             return { statusCode: 403, body: JSON.stringify({ error: 'Instagram requires login (blocked request)' }) };
        }

        const match = html.match(/<meta property="og:image" content="([^"]+)"/);
        let imageUrl = match ? match[1] : null;

        // Fallback: twitter:image
        if (!imageUrl) {
            const matchTwitter = html.match(/<meta name="twitter:image" content="([^"]+)"/);
            imageUrl = matchTwitter ? matchTwitter[1] : null;
        }

        if (imageUrl) imageUrl = imageUrl.replace(/&amp;/g, '&');

        if (!imageUrl) {
            // Log a snippet of HTML for debugging (careful with PII)
            console.log('No OG image found. HTML snippet:', html.substring(0, 500));
            return { statusCode: 404, body: JSON.stringify({ error: 'Image not found in metadata' }) };
        }

        const timestamp = Math.round(new Date().getTime() / 1000);
        const paramsToSign = `timestamp=${timestamp}${api_secret}`;
        const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

        const formData = new URLSearchParams();
        formData.append('file', imageUrl);
        formData.append('api_key', api_key);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
            method: 'POST',
            body: formData
        });

        let uploadData;
        try {
            uploadData = await uploadRes.json();
        } catch (e) {
             return { statusCode: 502, body: JSON.stringify({ error: 'Invalid response from Cloudinary' }) };
        }

        if (uploadData.secure_url) {
            return { statusCode: 200, body: JSON.stringify({ url: uploadData.secure_url }) };
        } else {
            console.error('Cloudinary upload error:', uploadData);
            return { statusCode: 500, body: JSON.stringify({ error: 'Cloudinary upload failed', details: uploadData }) };
        }

    } catch (error) {
        console.error('Handler error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: String(error) }) };
    }
};
