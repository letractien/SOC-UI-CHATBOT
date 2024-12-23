require('dotenv').config()

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const {handleStreamChunks} = require('../tools/handleStreamTool');
const {uploadFileToDriver} = require('./uploadService');

const llmsAPIAsk = process.env.LLMS_API_ASK;
const llmsAPIUpload = process.env.LLMS_API_UPLOAD;

async function sendUploadRequest(user_id, user_query, filePath) {
    const fileStream = fs.createReadStream(filePath);

    try {
        const response = await axios({
            method: 'post',
            url: llmsAPIUpload,
            data: {
                user_id: user_id,
                user_query: user_query,
                file: fileStream,
            },
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 300000,
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
            timeout: 300000,
        });

        return response;
    } catch (error) {
        console.error('Error during chatbot request:', error.message);
        throw new Error('Chatbot request failed');
    }
}

async function uploadFile(user_id, user_message, fileName, filePath, isUser=true) {
    let fileNameOut = undefined;
    let filePathOut = undefined;
    let fileId = undefined;
    let webContentLink = undefined;
    let webViewLink = undefined;
    let isSocReportFile = false;
    let chatbotMessage = "";

    try {
        if(isUser) {
            fileNameOut = fileName;
            filePathOut = filePath;

            const result = await uploadFileToDriver(fileName, filePath, isUser);
            fileId = result.fileId ? result.fileId : "";
            webContentLink = result.webContentLink ? result.webContentLink : "";
            webViewLink = result.webViewLink ? result.webViewLink : "";

        } else {
            const response = await sendUploadRequest(user_id, user_message, filePath);
            isSocReportFile = response.data.is_socreport_file ? response.data.is_socreport_file : false;
            chatbotMessage = response.data.response ? response.data.response : "";
        }

        return { 
            success: true, 
            fileNameOut,
            filePathOut,
            fileId,
            webContentLink,
            webViewLink,
            isSocReportFile,
            chatbotMessage
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
