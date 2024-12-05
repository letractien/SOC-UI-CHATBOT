require('dotenv').config();

const path = require('path');

const { getMessages, addNewChatBotMessages, addNewUserMessages } = require('../database/connectMongoDB');
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
    let success = true;
    let is_socreport_file = false;
    let chatbot_message = "";

    if (file){
        var fileName = file.filename || "";
        var filePath = path.resolve(__dirname, `../${file.destination}/${file.filename}`);

        try{
            const response1 = await uploadFile(cookie, "", fileName, filePath, true);
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
            const response2 = await uploadFile(cookie, user_message, fileName, filePath, false);
            success = (success && response2.success);
            is_socreport_file = response2.isSocReportFile;
            chatbot_message = response2.chatbotMessage;

            if (response2.success) {
                await addNewChatBotMessages(
                    cookie, 
                    chatbot_message, 
                    "", 
                    "",
                    "",
                    "",
                    ""
                );

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
    res.json({ 
        success, 
        is_socreport_file,
        'message': generateHTML(chatbot_message)
    });
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
                    chatbot_message, 
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
        chatbot_message = `#heading1: Đã xảy ra lỗi: Thời gian chờ quá lâu!`;
        res.write(`data: ${JSON.stringify({ user: 'chatbot', message: chatbot_message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();

        await addNewChatBotMessages(
            cookie, 
            chatbot_message, 
            "", 
            "", 
            "", 
            "", 
            ""
        );
        return;
    }
};

