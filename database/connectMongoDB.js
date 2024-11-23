require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const mongodb_uri = process.env.MONGODB_URI; 
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_collection = process.env.MONGODB_COLLECTION;
const client = new MongoClient(mongodb_uri, { useNewUrlParser: true, useUnifiedTopology: true });

const defaultChats = [
    { user: 'chatbot', message: '#heading1: Xin chào! Tôi là trợ lý chatbot chuyên cung cấp thông tin về an ninh thông tin và bảo mật mạng.' },
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

async function saveChatMessages(cookie, user_message, chatbot_message, filename){
    try {
        const oldMessage = await getMessages(cookie);
        let chats = oldMessage.length > 0 ? oldMessage : JSON.parse(JSON.stringify(defaultChats));

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

module.exports = {getMessages, saveChatMessages};