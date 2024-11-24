require('dotenv').config();

const {getMessages, addNewChatBotMessages, addNewUserMessages} = require('../database/connectMongoDB');
const { uploadFile, askChatbot } = require('../services/chatbotService');
const { generateHTML } = require('../tools/generateHTMLTool');
const cookieName = process.env.COOKIE_NAME || 'authentication';
let temporaryData = new Map();

exports.getChat = async (req, res) => {
    try {
        const cookie = req.cookies[cookieName];
        let chats = await getMessages(cookie);
        chats.forEach((chat) => {
            if (chat.user !== 'user') {
                chat.message = generateHTML(chat.message);
            }
        });
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
    await addNewUserMessages(cookie, user_message, filename);

    let success = false;
    let fileNameOut = undefined;
    let filePathOut = undefined;

    if (req.file) {
        try {
            const response = await uploadFile(cookie, filename);
            success = response.success;
            fileNameOut = response.fileName ? response.fileName : "";
            filePathOut = response.filePath ? response.filePath : "";
            if (!response.success) {
                return res.status(500).send('Lỗi khi xử lý yêu cầu tải lên.');
            }
            if (success){
                await addNewChatBotMessages(cookie, 'Đây là kết quả đánh giá file SOC report của bạn', fileNameOut, filePathOut);
            }
        } catch (error) {
            return res.status(500).send('Lỗi khi xử lý yêu cầu tải lên.');
        }
    }

    temporaryData.set(cookie, user_message);
    res.json({ success, 'fileName': fileNameOut, 'filePath': filePathOut });
};

exports.onMessage = async (req, res) => {
    const cookie = req.cookies[cookieName];
    let user_message = temporaryData.get(cookie);
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
                
                await addNewChatBotMessages(cookie, chatbot_message, "", "");
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

