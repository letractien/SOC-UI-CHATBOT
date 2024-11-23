require('dotenv').config();

const cookieSession = require('cookie-session');
const crypto = require('crypto');

const secretKey = process.env.SESSION_SECRET_KEY || crypto.randomBytes(64).toString('hex');
const maxAgeCookie = parseInt(process.env.SESSION_MAX_AGE) || 1000 * 60 * 60;
const cookieName = process.env.COOKIE_NAME || 'authentication';
const nodeEnv = process.env.NODE_ENV === 'production'

const session = cookieSession({
    keys: [secretKey],
    maxAge: maxAgeCookie,
    name: cookieName,
    secure: nodeEnv,
    saveUninitialized: false,
    resave: false,
    httpOnly: true,
});

module.exports = {session};
