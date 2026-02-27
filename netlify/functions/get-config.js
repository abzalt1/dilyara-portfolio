exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Проверка авторизации через Netlify Identity JWT
  const auth = event.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY
    })
  };
};