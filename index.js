const express = require('express')
const mariadb = require('mariadb')
const session = require('express-session')
const fileupload = require('express-fileupload')
const hash = require('pbkdf2-password')()
const app = express()

const rowPool = mariadb.createPool({
    host: 'localhost',
    user: 'ansme',
    password: '1029384756',
    database: 'TSystem',
    timezone: 'Z',
    rowsAsArray: true
})
const jsonPool = mariadb.createPool({
    host: 'localhost',
    user: 'ansme',
    password: '1029384756',
    database: 'TSystem',
    timezone: 'Z',
    rowsAsArray: false
})

const HTTP_PORT = 3000
const SALT = 'TSystem'

app.set('view engine', 'ejs');
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'TSystem'
}))
app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'))
app.use('/echarts', express.static('node_modules/echarts/dist'))
app.use('/echarts-gl', express.static('node_modules/echarts-gl/dist'))
app.use('/jquery', express.static('node_modules/jquery/dist'))

// Session-persisted message middleware
app.use(function (req, res, next) {
    var err = req.session.error;
    var msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
    if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
    next();
});

function restrict(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}

app.get('/', restrict, function (req, rep) {
    rep.render('dashboard');
})

app.get('/login', function (req, rep) {
    rep.render('login');
})

app.post('/auth', function (req, rep) {
    let username = req.body.username
    let password = req.body.password
    if (username && password) {
        hash({ password: password, salt: SALT }, function (_err, _password, _salt, hash) {
            rowPool.getConnection().then(conn => {
                conn.query("select word from auth where name = ?;", [username]).then(word => {
                    if (word[0] == hash) {
                        req.session.user = username;
                        rep.redirect('/');
                    }
                    else {
                        rep.redirect('/')
                    }
                }).catch(err => { console.log(err) })
            }).catch(err => { console.log(err) })
        })
    }
})

app.get('/logout', restrict, function (req, res) {
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function () {
        res.redirect('/');
    });
});

app.get('/fetch', restrict, function (req, rep) {
    let queryTargetUsefulDataNumber = req.query.useful;
    let queryTargetTime = req.query.time;
    if (queryTargetTime) {
        if (queryTargetTime == "now") {
            jsonPool.query("select x,y,z,temp from T_data where time = (select update_time from timeTable order by id desc limit 1);").then(result => {
                rep.json(result);
            }).catch(err => { console.log(err) })
        }
    }
    else if (queryTargetUsefulDataNumber) {
        if (queryTargetUsefulDataNumber > 0 && queryTargetUsefulDataNumber < 100) {
            jsonPool.query("select update_time,surfaceAvgTemp,innerAvgTemp,envTemp,maxTemp,minTemp,maxX,maxY,maxZ,minX,minY,minZ from timeTable order by id desc limit 10;").then(result => {
                rep.json(result);
            }).catch(err => { console.log(err) })
        }
    }
    else {
        rep.status(200);
    }
})

app.get('/r', restrict, function (req, rep) {
    rep.send('hello');
})

app.get('/test', restrict, function (req, rep) {
    rep.render('test');
})

app.listen(HTTP_PORT, () => {
    console.log(`Example app listening at http://localhost:${HTTP_PORT}`)
})
