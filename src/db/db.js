const mongoose = require('mongoose');
require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
    mongoose.connect(MONGO_URI)
        .then(() => {
            // Connected successfully
        })
        .catch((err) => {
            process.exit(1);
        })
}

module.exports = connectDB;