const express = require("express");
const router = express.Router();

const passport = require("passport");

const facebookController = require("./facebookController");


router.get(
    "/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
);


router.get(
    "/facebook/callbak",
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    facebookController
);


module.exports = router;