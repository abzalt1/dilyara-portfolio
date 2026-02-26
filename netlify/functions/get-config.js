exports.handler = async (event) => {
  // Разрешаем только GET запросы
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Возвращаем публичные ключи, необходимые для работы UI, из переменных окружения
  return {
    statusCode: 200,
    body: JSON.stringify({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY
    })
  };
};