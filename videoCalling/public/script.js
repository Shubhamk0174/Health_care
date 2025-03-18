const socket = io('http://localhost:3000', { transports: ['websocket', 'polling'] });
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
    host: 'localhost',
    port: '3001',
    path: '/'
});
const myVideo = document.createElement('video');
myVideo.muted = true; // Prevent hearing your own audio
const peers = {};

// 📹🎤 Get user media (Video & Audio)
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    console.log(" Audio Tracks:", stream.getAudioTracks());
    console.log(" Video Tracks:", stream.getVideoTracks());
    
    addVideoStream(myVideo, stream);

    // Answer incoming calls
    myPeer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            console.log("🔊 Receiving Audio Stream:", userVideoStream.getAudioTracks());
            addVideoStream(video, userVideoStream);
        });
    });

    socket.on('user-connected', userId => {
        console.log(`✅ User Connected: ${userId}`);
        connectToNewUser(userId, stream);
    });
}).catch(error => {
    console.error("🚨 Error accessing media devices:", error);
});

// 🔌 Handle user disconnection
socket.on('user-disconnected', userId => {
    console.log(`❌ User Disconnected: ${userId}`);
    if (peers[userId]) peers[userId].close();
});

// 🎤 Emit join-room event
myPeer.on('open', id => {
    console.log(`🔗 Connected to PeerServer with ID: ${id}`);
    socket.emit('join-room', ROOM_ID, id);
});

// 📞 Connect to a new user
function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');

    call.on('stream', userVideoStream => {
        console.log("🔊 Receiving Audio from User:", userVideoStream.getAudioTracks());
        addVideoStream(video, userVideoStream);
    });

    call.on('close', () => {
        video.remove();
    });

    peers[userId] = call;
}

// 📹 Add video stream to the grid
function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });

    console.log("🎬 Playing video, audio available:", stream.getAudioTracks().length > 0);
    
    videoGrid.append(video);
}
