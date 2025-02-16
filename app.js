const express = require("express");
const app = express();
const compression = require("compression");
const helmet = require("helmet");


const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
var sanitizer = require('sanitize')();
port = process.env.PORT || 3000;
//I need to check the cors later on
//even so it's not like a sercurity measure but whatever


//configs
const swaggerOptions = require("./config/swaggerConfig");
require("dotenv").config();
const passport = require("./auth/facebookPassport");

//middlewares
const authenticateJWT = require('./middlewares/authMiddleware');
const apiKeyMiddleware = require('./middlewares/apiKeyMiddleware');


//routes
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const facebookRoutes = require("./auth/facebookRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const videoRoutes = require("./routes/videoRoutes");
const reportRoutes = require("./routes/reportRoutes");
const commentRoutes = require("./routes/commentRoutes");
const followRoutes = require("./routes/followRoutes");
const rateRoutes = require("./routes/rateRoutes");
const chatRoutes = require("./routes/chatRoutes");
const savedVideosRoutes = require("./routes/savedVideosRoutes");
const notificationRoutes = require("./routes/notificationsRoutes");
const UserPersonalizationRoutes = require("./routes/userPersonalizationRoutes");

//Middlewares

// Middleware to check for API key
app.use(apiKeyMiddleware);

app.use(compression());

app.use(helmet());

app.use(passport.initialize());

app.use(express.json({ limit: '50kb' }));

const UserStatus = require("./config/db").UserStatus;
// Middleware to validate JWT and populate req.user
const pathToExclude = ['/api/user/signup', '/api/user/login', '/api/user/forgot-password/send-otp', '/api/user/forgot-password/verify-otp-and-set-new-password', '/api/user/verify-email-code', "/api/user/send-verification-code", "/api/auth/facebook/", "/api/auth/facebook/callback"];
app.use((req, res, next) => {
    if (pathToExclude.includes(req.path) || req.path.startsWith("/api-docs")) {
        next();
    } else {
        authenticateJWT(req, res, async (err) => {
            if (err) {
                // If an error occurred in express-jwt, send a response with the error
                return res.status(401).json({ error: err.message });
            }
            const {userId } = req.user;
            const userStatus = await UserStatus.findOne({ where: { userId } });
            if (!userStatus)
                return res.status(403).json({ error: "User status not found" });

            if (userStatus.isBanned)
                return res.status(403).json({ error: "You are banned" });

            next();
        });
    }
});

// Error handler for express-jwt
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ error: 'Invalid token' });
    }
});

//To convert json string to a json object
app.use(express.json());

//Middleware to log the request method and path
app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

// function sanitizeInput(req, res, next) {
//     for (let key in req.body) {
//         if (req.body.hasOwnProperty(key) && typeof req.body[key] === 'string') {
//             req.body[key] = sanitizer.value(req.body[key], 'string');
//         }
//     }
//     for (let key in req.params) {
//         if (req.params.hasOwnProperty(key) && typeof req.params[key] === 'string') {
//             req.params[key] = sanitizer.value(req.params[key], 'string');
//         }
//     }
//     next();
// }

// app.use(sanitizeInput);


//swagger documentation
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

//Routes
app.use("/api/user/", userRoutes);
app.use("/api/profile/", profileRoutes);
app.use("/api/auth/", facebookRoutes);
app.use("/api/transaction/", transactionRoutes);
app.use("/api/video/", videoRoutes);
app.use("/api/report/", reportRoutes);
app.use("/api/comment/", commentRoutes);
app.use("/api/follow/", followRoutes);
app.use("/api/rate/", rateRoutes);
app.use("/api/chat/", chatRoutes);
app.use("/api/profile/", savedVideosRoutes);
app.use("/api/notification/", notificationRoutes);
app.use("/api/user-personalization/", UserPersonalizationRoutes);


const makeAdmin = require("./controllers/adminController");
//makeAdmin(1);


module.exports = app;