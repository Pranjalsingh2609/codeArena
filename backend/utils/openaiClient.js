// backend/utils/openaiClient.js
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config(); // ensure .env is loaded

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // reads your actual key
});

const openai = new OpenAIApi(configuration);

module.exports = openai;