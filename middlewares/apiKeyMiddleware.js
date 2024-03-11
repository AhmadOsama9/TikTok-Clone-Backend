//function ((req, res, next) => {
//     const apiKey = req.get('X-API-KEY');
//     if (!apiKey || apiKey !== process.env.API_KEY) {
//         return res.status(403).json({ error: 'Invalid API key' });
//     }
//     next();
// });

function apiKeyMiddleware  (req, res, next) {
    if (req.path.startsWith("/api-docs") || req.path.startsWith("/api/auth")) {
        next();
    } else {
        const apiKey = req.get('X-API-KEY');
        if (!apiKey || apiKey !== process.env.API_KEY) {
            return res.status(403).json({ error: 'Invalid API key' });
        }
        next();
    }
};

module.exports = apiKeyMiddleware;
