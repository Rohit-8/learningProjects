const express = require('express');
const contentController = require('../controllers/contentController');

const router = express.Router();

// V1 routes - existing functionality
router.post('/check', contentController.checkContent);
router.post('/clean', contentController.cleanContent);

module.exports = router;
