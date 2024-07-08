const express = require('express');
const { protect } = require('../middleware/Authmiddleware');
const { sendMesage, allMessages } = require('../controllers/messageController');
const router = express.Router();

router.route(`/`).post(protect, sendMesage);
router.route('/:chatId').get(protect, allMessages);

module.exports = router;
