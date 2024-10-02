require('dotenv').config();

const { getMessages, saveMessages } = require('../database/connectMongoDB');
const { uploadFile, askChatbot } = require('../functions/chatbotService');
const cookieName = process.env.COOKIE_NAME || 'authentication';

const defaultChats = [
    { user: 'chatbot', message: 'Chào bạn, tôi có thể giúp gì cho bạn?' },
];

exports.getChat = async (req, res) => {
    try {
        const cookie = req.cookies[cookieName];
        const oldMessage = await getMessages(cookie);
        const chats = oldMessage.length > 0 ? oldMessage : defaultChats.slice();
        res.render('chatbot', { chats });
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi khi lấy tin nhắn.');
    }
};

exports.postChat = async (req, res) => {
    const cookie = req.cookies[cookieName];
    const user_message = req.body.message;

    if (req.file) {
        try {
            const upload_success = await uploadFile(cookie, req.file.originalname);
        } catch (error) {
            return res.status(500).send('Lỗi khi xử lý yêu cầu tải lên.');
        }
    }

    try {
        const chatbot_message = await askChatbot(cookie, user_message);
        const oldMessage = await getMessages(cookie);
        let chats = oldMessage.length > 0 ? oldMessage : defaultChats.slice();

        chats.push({ user: 'user', message: user_message });
        chats.push({ user: 'chatbot', message: chatbot_message });

        await saveMessages(cookie, chats);
        res.json({ message: chatbot_message });
            
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi khi xử lý yêu cầu.');
    }
};
