require('dotenv').config();

const multer = require('multer');

const storePath = process.env.STORE_PATH || './uploads/';
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, storePath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);  
    }
});

const upload = multer({ storage: storage });
module.exports = upload;