exports.getLogin = (req, res) => {
    res.render('login');
};

exports.postLogin = (req, res) => {
    // Xử lý logic đăng nhập
};

exports.getRegister = (req, res) => {
    res.render('register');
};

exports.postRegister = (req, res) => {
    // Xử lý logic đăng ký
};

exports.logout = (req, res) => {
    req.logout();
    req.session.chats = [];
    res.redirect('/');
};