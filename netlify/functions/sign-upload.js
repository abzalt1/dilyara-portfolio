const crypto = require('crypto');

exports.handler = async (event) => {
  // Разрешаем только GET запросы
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  const api_secret = process.env.CLOUDINARY_API_SECRET;

  // Генерируем timestamp (время)
  const timestamp = Math.round(new Date().getTime() / 1000);

  // Создаем подпись (Signature)
  // Cloudinary требует подписать параметры: timestamp + api_secret
  const signature = crypto.createHash('sha1')
    .update(`timestamp=${timestamp}${api_secret}`)
    .digest('hex');

  return {
    statusCode: 200,
    body: JSON.stringify({ signature, timestamp })
  };
};
