require('dotenv').config()

const fs = require('fs');
const path = require('path');
const responsePath = process.env.RESPONSE_PATH || './responses/';

function saveStreamToFile(stream) {
    const now = new Date();
    const formattedDate = `${now.getHours()}-${now.getMinutes()}_${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;

    let fileName = `Information_Security_Evaluation_${formattedDate}.pdf`;
    let filePath = path.join(responsePath, fileName);

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        stream.data.pipe(writer);

        writer.on('finish', () => resolve({fileName, filePath}));
        writer.on('error', reject);
    });
}

module.exports = {saveStreamToFile};