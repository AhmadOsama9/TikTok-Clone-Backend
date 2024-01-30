const express = require("express");
const router = express.Router();

const {
    test,
    AddUserObjectTest, 
} = require("../controllers/userController");


router.get("/test", test);

module.exports = router;