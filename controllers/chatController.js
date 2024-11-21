require('dotenv').config();

const { getMessages, saveMessages } = require('../database/connectMongoDB');
const { uploadFileSOC, uploadFileCommon, askChatbot } = require('../functions/chatbotService');
const cookieName = process.env.COOKIE_NAME || 'authentication';
let temporaryData = new Map();

const defaultChats = [
    { user: 'chatbot', message: 'Chào bạn, tôi có thể giúp gì cho bạn?' },
];

const saveChatMessages = async (cookie, user_message, chatbot_message, filename) => {
    try {
        const oldMessage = await getMessages(cookie);
        let chats = oldMessage.length > 0 ? oldMessage : defaultChats.slice();

        if (user_message === "<<<<Hi>>>>"){
            user_message = filename;
        } else if (filename !== ""){
            user_message = filename + "</br>" + user_message;
        } else {
            user_message = user_message;
        }

        chats.push({ user: 'user', message: user_message });
        chats.push({ user: 'chatbot', message: chatbot_message });

        await saveMessages(cookie, chats);
    } catch (error) {
        console.error('Error saving chat messages:', error);
    }
};

exports.getChat = async (req, res) => {
    try {
        const cookie = req.cookies[cookieName];
        const oldMessage = await getMessages(cookie);
        let chats = oldMessage.length > 0 ? oldMessage : defaultChats.slice();
        res.render('chatbot', { chats });
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi khi lấy tin nhắn.');
    }
};

exports.postChat = async (req, res) => {
    const cookie = req.cookies[cookieName];
    var user_message = req.body.message || "<<<<Hi>>>>";
    var filename = req.file ? req.file.originalname : "";

    if (req.file) {
        try {
            // const upload_success = await uploadFileSOC(cookie, filename);
            const upload_success = await uploadFileCommon(cookie, filename);

            if (!upload_success) {
                return res.status(500).send('Lỗi khi xử lý yêu cầu tải lên.');
            }
        } catch (error) {
            return res.status(500).send('Lỗi khi xử lý yêu cầu tải lên.');
        }
    }

    temporaryData.set(cookie, [user_message, filename]);
    res.status(200).send({ status: 'Message received' });
};

exports.onMessage = async (req, res) => {
    const cookie = req.cookies[cookieName];
    let user_message = temporaryData.get(cookie)[0];
    let filename = temporaryData.get(cookie)[1];
    let chatbot_message = "";

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); 

    try {

        await askChatbot(cookie, user_message, async (chunk) => {
            if (chunk === null) {
                res.write('data: [DONE]\n\n');
                res.end();
                
                await saveChatMessages(cookie, user_message, chatbot_message, filename);
                return;
            }

            chatbot_message += chunk;
            res.write(`data: ${JSON.stringify({ user: 'chatbot', message: chunk })}\n\n`);
        });

    } catch (error) {
        console.error(error);
        res.write('data: {"message": "An error occurred"}\n\n');
        res.end();
    }
};

