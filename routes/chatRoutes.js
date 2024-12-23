const express = require('express');
const chatController = require('../controllers/chatController');
const upload = require('../config/multerConfig');
const router = express.Router();

router.get('/', chatController.getChat);
router.post('/', upload.single('file'), chatController.postChat);

router.get('/onMessage', chatController.onMessage);

module.exports = router;
