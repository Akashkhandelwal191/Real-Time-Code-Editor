require('dotenv').config();
const express = require('express')
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
const http = require('http');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const server = http.createServer(app);

const {Server}  = require('socket.io');
const ACTIONS = require('./src/Action');

// In-memory user store
const authenticatedUsers = {};
// Enforce single active session per Google user id
const activeUserSessions = {};

const io = new Server(server, {
    path: '/socket.io',
    cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST']
    },
});

// Base URL for OAuth callbacks
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: `${BASE_URL}/auth/google/callback`,
    passReqToCallback: true,
},
(req, accessToken, refreshToken, profile, done) => {
    // Block if another active session exists for the same Google user
    const existingSessionId = activeUserSessions[profile.id];
    if (existingSessionId && existingSessionId !== req.sessionID) {
        return done(null, false, { message: 'ALREADY_LOGGED_IN' });
    }
    authenticatedUsers[profile.id] = profile;
    activeUserSessions[profile.id] = req.sessionID;
    done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const user = authenticatedUsers[id];
    done(null, user);
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            const reason = info && info.message === 'ALREADY_LOGGED_IN' ? 'already_logged_in' : 'auth_failed';
            return res.redirect(`/?error=${reason}`);
        }
        req.logIn(user, (loginErr) => {
            if (loginErr) return next(loginErr);
            return res.redirect('/');
        });
    })(req, res, next);
});

// Optional explicit failure route for easier debugging
app.get('/auth/google/failure', (req, res) => {
    res.status(401).json({ success: false, message: 'Google authentication failed' });
});

const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({
        success: false,
        message: 'user failed to authenticate.'
    });
}

app.get('/login/success', isLoggedIn, (req, res) => {
    res.json({
        success: true,
        message: 'user has successfully authenticated',
        user: req.user,
        cookies: req.cookies
    });
});

app.get('/logout', (req, res, next) => {
    const userId = req.user && req.user.id;
    req.logout((err) => {
        if (err) return next(err);
        if (userId && activeUserSessions[userId]) {
            delete activeUserSessions[userId];
        }
        req.session.destroy(() => {
            res.redirect('/');
        });
    });
});

// Always serve the built React app (avoids %PUBLIC_URL% issues in public/index.html)
app.use(express.static(path.join(__dirname, 'build')));

// Explicit SPA routes to avoid intercepting Socket.IO and other endpoints
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.get('/editor/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});



const userSocketMap = {};
function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId]?.username,
                avatar: userSocketMap[socketId]?.avatar,
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username, avatar }) => {
        userSocketMap[socket.id] = { username, avatar };
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
        console.log('SYNC CODE',code);
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id]?.username,
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });

    socket.on("typing",({username})=>{
        socket.broadcast.emit("typing",{username:username});
        console.log('Server:',username);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT,()=>{
  
      console.log(`Listening on PORT ${PORT}`);
});