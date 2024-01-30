const express = require("express");
const router = express.Router();

const {
    AddUserObjectTest, 
} = require("../controllers/userController");


router.get("/test", AddUserObjectTest);

module.exports = router;