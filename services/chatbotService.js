require('dotenv').config()

const fs = require('fs');
const axios = require('axios');

const storePath = process.env.STORE_PATH || './uploads/';
const llmsAPIAsk = process.env.LLMS_API_ASK;

const llmsAPIUploadSOC = process.env.LLMS_API_UPLOAD_SOC;
const llmsAPIUploadCommon = process.env.LLMS_API_UPLOAD_COMMON;

exports.uploadFileSOC = async (user_id, fileName) => {
    const file = fs.createReadStream(storePath + fileName);
    
    try {
        const response = await axios({
            method: 'post',
            url: llmsAPIUploadSOC,
            data: {
                user_id: user_id,
                file: file,
            },
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 180000,
        });

        return response.data;
    } catch (error) {
        console.error('Error during file upload:', error);
        throw new Error('File upload failed');
    }
};

exports.uploadFileCommon = async (user_id, fileName) => {
    const file = fs.createReadStream(storePath + fileName);
    
    try {
        const response = await axios({
            method: 'post',
            url: llmsAPIUploadCommon,
            data: {
                user_id: user_id,
                file: file,
            },
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 180000,
        });

        return response.data;
    } catch (error) {
        console.error('Error during file upload:', error);
        throw new Error('File upload failed');
    }
};

exports.askChatbot = async (user_id, user_query, onChunkReceived) => {
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

        response.data.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    const parsed = JSON.parse(line);
                    if (parsed.success && parsed.response) {
                        onChunkReceived(parsed.response);
                    }
                }
            }
        });

        response.data.on('end', () => {
            onChunkReceived(null); 
        });
        
        return response.data;
    } catch (error) {
        console.error('Error during chatbot request:', error);
        throw new Error('Chatbot request failed');
    }
};
