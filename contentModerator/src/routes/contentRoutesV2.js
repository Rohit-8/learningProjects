const express = require('express');
const contentControllerV2 = require('../controllers/contentControllerV2');

const router = express.Router();

// V2 routes - Google Perspective API with advanced features
router.post('/analyze', contentControllerV2.analyzeContent);
router.post('/clean', contentControllerV2.cleanContent);
router.post('/hybrid-analysis', contentControllerV2.hybridAnalysis);
router.post('/batch-analysis', contentControllerV2.batchAnalysis);
router.get('/history', contentControllerV2.getAnalysisHistory);

module.exports = router;
