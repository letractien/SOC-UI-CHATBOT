require('dotenv').config()

const fs = require('fs');
const axios = require('axios');

const storePath = process.env.STORE_PATH || './uploads/';
const llmsAPIAsk = process.env.LLMS_API_ASK;
const llmsAPIUpload = process.env.LLMS_API_UPLOAD;

exports.uploadFile = async (user_id, fileName) => {
    const file = fs.createReadStream(storePath + fileName);
    
    try {
        const response = await axios.post(llmsAPIUpload, 
            {
                user_id: user_id,
                file: file,
            },
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 180000
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error during file upload:', error);
        throw new Error('File upload failed');
    }
};

exports.askChatbot = async (user_id, user_query) => {
    try {
        const response = await axios.post(llmsAPIAsk, 
            {
                user_id: user_id,
                user_query: user_query,
            },
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 180000
            }
        );
        
        return response.data.response;
    } catch (error) {
        console.error('Error during chatbot request:', error);
        throw new Error('Chatbot request failed');
    }
};
