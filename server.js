const express = require("express");
const app = express();
require("dotenv").config();
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const bodyParser = require("body-parser");
var sanitizer = require('sanitize')();
const authenticateJWT = require('./middlewares/authMiddleware');
//I need to check the cors later on
//even so it's not like a sercurity measure but whatever
const port = 3000;

//routes
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const facebookRoutes = require("./routes/facebookRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

app.use(express.json());

app.use(bodyParser.json());

// app.use((req, res, next) => {
//     const apiKey = req.get('X-API-KEY');
//     if (!apiKey || apiKey !== process.env.API_KEY) {
//         return res.status(403).json({ error: 'Invalid API key' });
//     }
//     next();
// });

app.use((req, res, next) => {
    if (req.path.startsWith("/api-docs")) {
        next();
    } else {
        const apiKey = req.get('X-API-KEY');
        if (!apiKey || apiKey !== process.env.API_KEY) {
            return res.status(403).json({ error: 'Invalid API key' });
        }
        next();
    }
});

const pathToExclude = ['/api/user/signup', '/api/user/login', '/api/user/forgot-password', '/api/user/verify-email-code', '/api/user/get-all-emails'];

// Middleware to validate JWT and populate req.user
app.use((req, res, next) => {
    if (pathToExclude.includes(req.path) || req.path.startsWith("/api-docs")) {
        next();
    } else {
        authenticateJWT(req, res, next);
    }
});


app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ error: 'Invalid token' });
    }
});


app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

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

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "APP API",
            version: "1.0.0",
            description: "Story APP API",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

//Routes
app.use("/api/user/", userRoutes);
app.use("/api/profile/", profileRoutes);
app.use("/api/auth/", facebookRoutes);
app.use("/api/transaction/", transactionRoutes);


app.get("/", (req, res) => {
    res.send("Works fine");
});


app.listen(port, () => {
    console.log("Listening on port 3000")
});



