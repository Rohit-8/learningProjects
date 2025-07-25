const express = require('express');
const contentController = require('../controllers/contentController');

const router = express.Router();

router.post('/check', contentController.checkContent);
router.post('/clean', contentController.cleanContent);

module.exports = router;
