require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const mongodb_uri = process.env.MONGODB_URI; 
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_collection = process.env.MONGODB_COLLECTION;
const client = new MongoClient(mongodb_uri, { useNewUrlParser: true, useUnifiedTopology: true });

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
        return result?.messages || [];
    } catch (err) {
        console.error('Error retrieving messages:', err);
        return [];
    } finally {
        await client.close();
    }
}

module.exports = { getMessages, saveMessages }