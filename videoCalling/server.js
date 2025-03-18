const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidV4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Generate a unique room ID and redirect
app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

// Serve the room page
app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (roomId, userId) => {
        if (!roomId || !userId) {
            console.error("Error: Missing roomId or userId");
            return;
        }
        console.log(`User ${userId} joined room ${roomId}`);

        socket.join(roomId);
        io.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected from room ${roomId}`);
            io.to(roomId).emit('user-disconnected', userId);
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
