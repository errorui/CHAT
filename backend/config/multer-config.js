const multer = require('multer');

// Memory storage
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;
