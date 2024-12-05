require('dotenv').config()

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const {saveStreamFileToLocal} = require('../tools/processFileTool');
const {handleStreamChunks} = require('../tools/handleStreamTool');
const {uploadFileToDriver} = require('./uploadService');

const llmsAPIAsk = process.env.LLMS_API_ASK;
const llmsAPIUpload = process.env.LLMS_API_UPLOAD;

async function sendUploadRequest(user_id, user_query, filePath, retries = 3, retryDelay = 5000) {
    const fileStream = fs.createReadStream(filePath);
    let attempts = 0;

    while (attempts < retries) {
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
                timeout: 300000, // 5 phút
            });

            return response; // Thành công, trả về response
        } catch (error) {
            attempts++;

            if (error.response?.status === 524) {
                console.warn(`Attempt ${attempts} failed due to 524 timeout. Retrying...`);
            } else {
                console.error('Error during API request:', error.message);
                throw new Error('API request failed');
            }

            if (attempts < retries) {
                // Chờ một khoảng thời gian trước khi retry
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    throw new Error('Max retries reached. API request failed');
}

async function sendChatbotRequest(user_id, user_query, retries = 3, retryDelay = 5000) {
    let attempts = 0;

    while (attempts < retries) {
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
                timeout: 300000, // 5 phút
            });

            return response; // Trả về dữ liệu nếu thành công
        } catch (error) {
            attempts++;

            if (error.response?.status === 524) {
                console.warn(`Attempt ${attempts} failed due to 524 timeout. Retrying...`);
            } else {
                console.error('Error during chatbot request:', error.message);
                throw new Error('Chatbot request failed');
            }

            if (attempts < retries) {
                // Chờ một thời gian trước khi retry
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    throw new Error('Max retries reached. Chatbot request failed');
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
