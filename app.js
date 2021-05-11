const express = require('express');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

const { ensureAuthenticated, forwardAuthenticated } = require('./config/auth');


const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});


//CSS STYLING
app.use('/assets', express.static('assets'));

// Passport Config
require('./config/passport')(passport);


//DB Config
const db = require('./config/keys').MongoURI;
const { name } = require('ejs');

//Connect to Mongo
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

//EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use('/peerjs', peerServer);

// Express body parser
app.use(express.urlencoded({ extended: false }));


//Express Session
app.use(
    session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});


//Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));

//Importing UUID to our room and PEER js



app.get('/views/room', (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

app.get('/:room', ensureAuthenticated, (req, res) => {
    res.render('room', { roomId: req.params.room })
});

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.broadcast.to(roomId).emit('user-connected', userId);
        // messages
        socket.on('message', (message) => {
            //send message to the same room
            io.to(roomId).emit('createMessage', message)
        });

        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
        })
    })
})

const PORT = process.env.PORT || 5000;

server.listen(PORT, console.log(`Server running on ${PORT}`));