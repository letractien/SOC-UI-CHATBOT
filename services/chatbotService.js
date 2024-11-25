require('dotenv').config()

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const {saveStreamFileToLocal} = require('../tools/processFileTool');
const {handleStreamChunks} = require('../tools/handleStreamTool');
const {uploadFileToDriver} = require('./uploadService');

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

async function uploadFile(user_id, fileName, filePath, isUser=true) {
    let fileNameOut = undefined;
    let filePathOut = undefined;
    let fileId = undefined;
    let webContentLink = undefined;
    let webViewLink = undefined;

    try {
        if(isUser) {
            fileNameOut = fileName;
            filePathOut = filePath;

            const result2 = await uploadFileToDriver(fileName, filePath, isUser);
            fileId = result2.fileId ? result2.fileId : "";
            webContentLink = result2.webContentLink ? result2.webContentLink : "";
            webViewLink = result2.webViewLink ? result2.webViewLink : "";
        } else {
            const responseStream = await sendUploadRequest(user_id, filePath);
            const result1 = await saveStreamFileToLocal(responseStream);
            fileNameOut = result1.fileName ? result1.fileName : "";
            filePathOut = result1.filePath ? result1.filePath : "";
    
            const result2 = await uploadFileToDriver(fileNameOut, filePathOut, isUser);
            fileId = result2.fileId ? result2.fileId : "";
            webContentLink = result2.webContentLink ? result2.webContentLink : "";
            webViewLink = result2.webViewLink ? result1.webViewLink : "";
        }

        return { 
            success: true, 
            fileNameOut,
            filePathOut,
            fileId,
            webContentLink,
            webViewLink
        };
    } catch (error) {
        console.error('Error during file upload:', error.message);
        return { success: false };
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
