const crypto = require('crypto');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { url } = JSON.parse(event.body);
        const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
        const api_key = process.env.CLOUDINARY_API_KEY;
        const api_secret = process.env.CLOUDINARY_API_SECRET;

        if (!url) return { statusCode: 400, body: 'Missing url' };

        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
        });
        const html = await response.text();

        const match = html.match(/<meta property="og:image" content="([^"]+)"/);
        let imageUrl = match ? match[1] : null;
        if (imageUrl) imageUrl = imageUrl.replace(/&amp;/g, '&');

        if (!imageUrl) return { statusCode: 404, body: JSON.stringify({ error: 'Image not found' }) };

        const timestamp = Math.round(new Date().getTime() / 1000);
        const paramsToSign = `file=${imageUrl}&timestamp=${timestamp}${api_secret}`;
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
        const uploadData = await uploadRes.json();

        if (uploadData.secure_url) {
            return { statusCode: 200, body: JSON.stringify({ url: uploadData.secure_url }) };
        } else {
            return { statusCode: 500, body: JSON.stringify({ error: 'Cloudinary upload failed', details: uploadData }) };
        }

    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: String(error) };
    }
};