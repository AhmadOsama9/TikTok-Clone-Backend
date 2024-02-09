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

module.exports = swaggerOptions;