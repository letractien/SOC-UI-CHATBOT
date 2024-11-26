require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const mongodb_uri = process.env.MONGODB_URI; 
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_collection = process.env.MONGODB_COLLECTION;
const client = new MongoClient(mongodb_uri, { useNewUrlParser: true, useUnifiedTopology: true });

const defaultChats = [
    { 
        user: 'chatbot', 
        message: '#heading1: Xin chào! Tôi là trợ lý chatbot chuyên cung cấp thông tin về an ninh thông tin và bảo mật mạng.' ,
        filename: "", 
        filePath: "",
        fileId: "",
        webContentLink: "",
        webViewLink: "" 
    }
];

async function saveMessages(cookie, messages) {
    try {
        await client.connect();
        const db = client.db(mongodb_database);
        const collection = db.collection(mongodb_collection);
        await collection.updateOne(
            { cookie },
            { $set: { messages } },
            { upsert: true }
        );
    } catch (err) {
        console.error('Error saving messages:', err);
    } finally {
        await client.close();
    }
}

async function getMessages(cookie) {
    try {
        await client.connect();
        const db = client.db(mongodb_database);
        const collection = db.collection(mongodb_collection);
        const result = await collection.findOne({ cookie });
        const oldMessage = result?.messages || [];
        let chats = oldMessage.length > 0 ? oldMessage : JSON.parse(JSON.stringify(defaultChats));
        return chats;
    } catch (err) {
        console.error('Error retrieving messages:', err);
        return [];
    } finally {
        await client.close();
    }
}

async function addNewUserMessages(cookie, user_message, fileName, filePath, fileId, webContentLink, webViewLink){
    try {
        const oldMessage = await getMessages(cookie);
        let chats = oldMessage.length > 0 ? oldMessage : JSON.parse(JSON.stringify(defaultChats));

        if (user_message === "<<<<Hi>>>>" && fileName === ""){
            return;
        } else if (user_message !== "<<<<Hi>>>>" && fileName !== ""){
            user_message = fileName + "</br>" + user_message;
        } else if (user_message !== "<<<<Hi>>>>"){
            user_message = user_message;
        } else if (fileName !== ""){
            user_message = fileName;
        }

        chats.push({ 
            user: 'user', 
            message: user_message, 
            fileName, 
            filePath,
            fileId,
            webContentLink,
            webViewLink 
        });

        await saveMessages(cookie, chats);

    } catch (error) {
        console.error('Error saving chat messages:', error);
    }
};

async function addNewChatBotMessages(cookie, chatbot_message, fileName, filePath, fileId, webContentLink, webViewLink){
    try {
        const oldMessage = await getMessages(cookie);
        let chats = oldMessage.length > 0 ? oldMessage : JSON.parse(JSON.stringify(defaultChats));

        if (chatbot_message === "" && fileName === "" && filePath === ""){
            return; 
        } else if (fileName !== "" && filePath !== ""){
            chatbot_message =  `
                #heading1: ${chatbot_message}
                #heading2: ${fileName}
                **sources**: ${webViewLink}
            `;
        }

        chats.push({ 
            user: 'chatbot', 
            message: chatbot_message,
            fileName, 
            filePath,
            fileId,
            webContentLink,
            webViewLink  
        });
        await saveMessages(cookie, chats);

    } catch (error) {
        console.error('Error saving chat messages:', error);
    }
};

module.exports = {getMessages, addNewChatBotMessages, addNewUserMessages};