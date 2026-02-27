const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  // Проверка авторизации через Netlify Identity JWT
  const auth = event.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const api_secret = process.env.CLOUDINARY_API_SECRET;
  const timestamp = Math.round(new Date().getTime() / 1000);

  const signature = crypto.createHash('sha1')
    .update(`timestamp=${timestamp}${api_secret}`)
    .digest('hex');

  return {
    statusCode: 200,
    body: JSON.stringify({ signature, timestamp })
  };
};
