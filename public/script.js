const socket = io('/')
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443'
});


let myVideoStream;
navigator.mediaDevices.getUserMedia =
    navigator.mediaDevices.getUserMedia ||
    navigator.mediaDevices.webkitGetUserMedia ||
    navigator.mediaDevices.mozGetUserMedia;

const myVideo = document.createElement('video')
myVideo.muted = true;

const peers = {}
if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    }).then(stream => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream)
        myPeer.on('call', call => {
            call.answer(stream)
            const video = document.createElement('video')
            video.controls = true;
            call.on('stream', userVideoStream => {
                addVideoStream(video, userVideoStream)
            })
        })

        socket.on('user-connected', userId => {

                // user is joining
                setTimeout(() => {
                    // user joined
                    connectToNewUser(userId, stream)
                }, 1000)
            })
            // input value
        let text = $("input");
        // when press enter send message
        $('html').keydown(function(e) {
            if (e.which == 13 && text.val().length !== 0) {
                socket.emit('message', text.val());
                text.val('')
            }
        });
        socket.on("createMessage", message => {
            $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
            scrollToBottom()
        })
    })
}

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')

    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
}

function addVideoStream(video, stream) {
    video.controls = true;
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}

//screenShare 
const screenshare = () => {
    navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: 'always'
        },
        audio: {
            echoCancellation: true,
            noiseSupprission: true
        }
    }).then(stream => {
        let videoTrack = stream.getVideoTracks()[0];
        videoTrack.onended = function() {
            stopScreenShare();
        }
        for (let x = 0; x < currentPeer.length; x++) {

            let sender = currentPeer[x].getSenders().find(function(s) {
                return s.track.kind == videoTrack.kind;
            })

            sender.replaceTrack(videoTrack);
        }

    })

}

function stopScreenShare() {
    let videoTrack = myVideoStream.getVideoTracks()[0];
    let sender;
    for (let x = 0; x < currentPeer.length; x++) {
        sender = currentPeer[x].getSenders().find(function(s) {
            return s.track.kind == videoTrack.kind;
        })
        sender.replaceTrack(videoTrack);
    }
}

const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}


const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

const playStop = () => {
    console.log('object')
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo()
    } else {
        setStopVideo()
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

const setMuteButton = () => {
    const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
    const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
    const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
    document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
    const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
    document.querySelector('.main__video_button').innerHTML = html;
}


function copyToClipboard(text) {
    var inputc = document.body.appendChild(document.createElement("input"));
    inputc.value = window.location.href;
    inputc.focus();
    inputc.select();
    document.execCommand('copy');
    inputc.parentNode.removeChild(inputc);
    alert("Share this URL to add participants.");
}

function leavemeet(text) {
    window.history.back()

}


//raised hand option
const raisedHand = () => {
    const sysbol = "&#9995;";
    socket.emit('message', sysbol);
    unChangeHandLogo();
}

const unChangeHandLogo = () => {
    const html = `<i class="far fa-hand-paper" style="color:red;"></i>
                  <span>Raised</span>`;
    document.querySelector('.raisedHand').innerHTML = html;
    changeHandLogo();
}

const changeHandLogo = () => {
    setInterval(function() {
        const html = `<i class="far fa-hand-paper" style="color:"white"></i>
                  <span>Hand</span>`;
        document.querySelector('.raisedHand').innerHTML = html;
    }, 3000);
}