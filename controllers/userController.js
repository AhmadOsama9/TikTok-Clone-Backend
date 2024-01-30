const User = require("../db");

const test = (req, res) => {
    res.json({message: "The test works fine"});
}

const AddUserObjectTest = (req, res) => {
    const userObject = {
        name: "John",
        phone: "123456789",
        email: "ahmed@gmail.com"
    }
}

module.exports = {
    test,
    AddUserObjectTest,
}
