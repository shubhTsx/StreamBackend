require('dotenv').config();

// Validate critical environment variables before starting
const requiredEnvVars = ['JWT_KEY', 'MONGO_URI'];
const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
    process.exit(1);
}

const app = require('./src/app');
const PORT = process.env.PORT || 4000;

app.listen(PORT);