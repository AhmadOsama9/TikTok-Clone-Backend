const expressJwt = require('express-jwt');

const authenticateJWT = expressJwt({
    secret: process.env.JWT_SECRET,
    algorithms: ['HS256'],
    userProperty: 'user',
});

module.exports = authenticateJWT;