const express = require("express");
const app = express();
require("dotenv").config();
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const bodyParser = require("body-parser");
const authenticateJWT = require('./authMiddleware');
//I need to check the cors later on
//even so it's not like a sercurity measure but whatever
const port = 3000;

//routes
const userRoutes = require("./routes/userRoutes");
const googleRoutes = require("./routes/facebookRoutes");

app.use(express.json());

app.use(bodyParser.json());

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

app.use((req, res, next) => {
    const apiKey = req.get('X-API-KEY');
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(403).json({ error: 'Invalid API key' });
    }
    next();
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

app.use("/api/user/", userRoutes);
app.use("/api/auth/", googleRoutes);


app.get("/", (req, res) => {
    res.send("Works fine");
});


app.listen(port, () => {
    console.log("Listening on port 3000")
});



