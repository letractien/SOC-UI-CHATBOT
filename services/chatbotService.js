require('dotenv').config()

const fs = require('fs');
const axios = require('axios');
const path = require('path');
const {saveStreamToFile} = require('../tools/processFileTool');
const { handleStreamChunks } = require('../tools/handleStreamTool');

const uploadPath = process.env.UPLOAD_PATH || './uploads/';
const llmsAPIAsk = process.env.LLMS_API_ASK;
const llmsAPIUpload = process.env.LLMS_API_UPLOAD;

async function sendUploadRequest(user_id, filePath) {
    const fileStream = fs.createReadStream(filePath);

    try {
        const response = await axios({
            method: 'post',
            url: llmsAPIUpload,
            data: {
                user_id: user_id,
                file: fileStream,
            },
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            responseType: 'stream',
            timeout: 180000,
        });

        return response;
    } catch (error) {
        console.error('Error during API request:', error);
        throw new Error('API request failed');
    }
}

async function sendChatbotRequest(user_id, user_query) {
    try {
        const response = await axios({
            method: 'post',
            url: llmsAPIAsk,
            data: {
                user_id: user_id,
                user_query: user_query,
            },
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            responseType: 'stream',
            timeout: 180000,
        });

        return response;
    } catch (error) {
        console.error('Error during chatbot request:', error.message);
        throw new Error('Chatbot request failed');
    }
}

async function uploadFile(user_id, fileName) {
    const uploadFilePath = path.join(uploadPath, fileName);

    try {
        const responseStream = await sendUploadRequest(user_id, uploadFilePath);
        const result = await saveStreamToFile(responseStream);
        let fileName = result.fileName ? result.fileName : "";
        let filePath = result.filePath ? result.filePath : "";
        return { success: true, fileName, filePath};
    } catch (error) {
        console.error('Error during file upload:', error.message);
        return { success: false, error: error.message };
    }
}

async function askChatbot(user_id, user_query, onChunkReceived) {
    try {
        const response = await sendChatbotRequest(user_id, user_query);
        handleStreamChunks(response.data, onChunkReceived);
    } catch (error) {
        console.error('Error during chatbot interaction:', error.message);
        throw error;
    }
}

module.exports = {uploadFile, askChatbot};
