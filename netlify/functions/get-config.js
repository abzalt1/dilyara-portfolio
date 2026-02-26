exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

    // These keys are safe to expose to the admin client as they are public keys
    const config = {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY
    };

    if (!config.cloud_name || !config.api_key) {
         return {
             statusCode: 500,
             body: JSON.stringify({ error: "Missing environment variables" })
         };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(config)
    };
};
