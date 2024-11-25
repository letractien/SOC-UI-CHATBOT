require('dotenv').config();

const path = require('path');

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
    var file = req.file || undefined;
    let fileNameOut = undefined;
    let filePathOut = undefined;
    let success = false;

    if (file){
        var fileName = file.filename || "";
        var filePath = path.resolve(__dirname, `../${file.destination}/${file.filename}`);

        try{
            const response1 = await uploadFile(cookie, fileName, filePath, true);
            success = (success && response1.success);

            if (response1.success) {
                await addNewUserMessages(
                    cookie, 
                    user_message, 
                    response1.fileNameOut, 
                    response1.filePathOut,
                    response1.fileId,
                    response1.webContentLink,
                    response1.webViewLink
                );
            } else {
                return res.status(500).send('Lỗi khi xử lý yêu cầu tải lên.');
            }
        } catch (error) {
            return res.status(500).send('Lỗi khi xử lý yêu cầu tải lên.');
        }

        try {
            const response2 = await uploadFile(cookie, fileName, filePath, false);
            success = (success && response2.success);

            if (response2.success) {
                await addNewChatBotMessages(
                    cookie, 
                    'Đây là kết quả đánh giá file SOC report của bạn', 
                    response2.fileNameOut, 
                    response2.filePathOut,
                    response2.fileId,
                    response2.webContentLink,
                    response2.webViewLink
                );
                fileNameOut = response2.fileNameOut;
                filePathOut = response2.webViewLink;

            } else {
                return res.status(500).send('Lỗi khi xử lý yêu cầu tải lên.');
            }
        } catch (error) {
            return res.status(500).send('Lỗi khi xử lý yêu cầu tải lên.');
        }
    } else {
        await addNewUserMessages(
            cookie, 
            user_message, 
            "", 
            "", 
            "", 
            "", 
            ""
        );
    }

    temporaryData.set(cookie, user_message);
    res.json({ success, 'fileName': fileNameOut, 'filePath': filePathOut })
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
                
                await addNewChatBotMessages(
                    cookie, 
                    user_message, 
                    "", 
                    "", 
                    "", 
                    "", 
                    ""
                );
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

