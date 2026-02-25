const mongoose = require('mongoose');
require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
    mongoose.connect(MONGO_URI)
    .then(()=>{
        console.log("connected to database");
    })
    .catch((err) => {
         message: "error:" , err
        console.log(err);
    })
}

module.exports = connectDB;