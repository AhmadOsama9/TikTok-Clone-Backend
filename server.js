const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = 3000;

const userRoutes = require("./routes/userRoutes");

app.use(express.json());

app.use(bodyParser.json());

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

app.use("/api/user/", userRoutes);


app.get("/", (req, res) => {
    res.send("Works fine");
});


app.listen(port, () => {
    console.log("Listening on port 3000")
});



