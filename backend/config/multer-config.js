const multer = require('multer');

// Memory storage
const storage = multer.memoryStorage();

// stays well below MongoDB's 16 MB document limit once base64 encoded
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

module.exports = upload;
