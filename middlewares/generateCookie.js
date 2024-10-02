require('dotenv').config();

const crypto = require('crypto');
const cookieName = process.env.COOKIE_NAME || 'authentication';
const maxAgeCookie = parseInt(process.env.SESSION_MAX_AGE) || 1000 * 60 * 60;
const node_env = process.env.NODE_ENV === 'production'

function generateCookie(req, res, next) {
    let cookie = req.cookies[cookieName];

    if (!cookie) {
        cookie = crypto.randomBytes(64).toString('hex');
        res.cookie(cookieName, cookie, {
            maxAge: maxAgeCookie,
            httpOnly: true,
            secure: node_env,
        });
    }

    next();
}

module.exports = generateCookie;
