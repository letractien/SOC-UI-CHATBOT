require('dotenv').config()

const fs = require('fs');
const {google} = require('googleapis');

const clientIDDriver = process.env.CLIENT_ID_DRIVER || '';
const clientSecretDriver = process.env.CLIEN_SECRET_DRIVER || '';
const redirectURI = process.env.REDIRECT_URI || '';
const refreshToken = process.env.REFRESH_TOKEN || '';
const ChatbotDocumentsID = process.env.CHATBOT_DOCUMENTS_ID || '';
const UserDocumentsID = process.env.USER_DOCUMENTS_ID || '';

const oauth2Client = new google.auth.OAuth2(clientIDDriver, clientSecretDriver, redirectURI);
oauth2Client.setCredentials({refresh_token: refreshToken});

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
})

async function shareFileInDriver(fileId) {
    try {
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: "reader",
                type: "anyone"
            }
        });

        const getUrl = await drive.files.get({
            fileId: fileId,
            fields: 'webViewLink, webContentLink'
        });

        return getUrl;
    } catch (error) {
        console.error("Error when share file", error);
    }
}

async function uploadFileToDriver(fileName, filePath, isUser) {
    try {
        const fileMetadata = {
            name: fileName,
            parents: isUser ? [UserDocumentsID] : [ChatbotDocumentsID], 
        };
    
        const media = {
            mimeType: 'application/pdf',
            body: fs.createReadStream(filePath),
        };
    
        const uploadFileResponse = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
        });

        const getUrlResponse = await shareFileInDriver(
            uploadFileResponse.data.id
        );

        return {
            fileId : uploadFileResponse.data.id, 
            webContentLink : getUrlResponse.data.webContentLink, 
            webViewLink : getUrlResponse.data.webViewLink
        };
    } catch (error) {
        console.error("Error when upload file", error);
    }
}

async function deleteFileInDriver(fileId) {
    try {
        const deleteFileResponse = await drive.files.delete({
            fileId: fileId
        })
    } catch (error) {
        console.error("Error when delete file", error);
    }
}

module.exports = {uploadFileToDriver, deleteFileInDriver};