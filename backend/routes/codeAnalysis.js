// routes/codeAnalysis.js
const express = require("express");
const router = express.Router();
const { analyzeCode } = require("../controllers/codeAnalysisController");

router.post("/analyze-code", analyzeCode);

module.exports = router;