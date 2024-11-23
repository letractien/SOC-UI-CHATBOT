require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const cookieParser = require('cookie-parser');

const {session} = require('./middlewares/session');
const {generateCookie} = require('./middlewares/generateCookie');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(generateCookie);

app.set('view engine', 'ejs');
app.use(express.static('static'));

app.use('/', chatRoutes);
app.use('/', authRoutes);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running at http://localhost:${process.env.PORT}`);
});
