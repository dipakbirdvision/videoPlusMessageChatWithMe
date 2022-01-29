const socket = io('/')
const videoGrid = document.getElementById('video-grid');

// const myPeer = new Peer(undefined, {
//   host: '/',
//   port: '3001'
// })

const myPeer = new Peer({host: 'peerjsforchatwithdipak.herokuapp.com', secure: true, port:443})

function joinChat(){
  window.location = "/joinChat";
}

const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
})

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
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

// textChatting Start

let name;
do{
    name = prompt("Enter Your name...")
}while(!name)

socket.emit('new-user-joined',name)

socket.on('user-joined',name=>{
    appendMessage(`${name} joined the chat`, 'incoming')
})

socket.on('recieve',data=>{
    appendMessage(`${data.name}: ${data.message}`, 'incoming')
})

socket.on('left',name=>{
    appendMessage(`${name} left the chat`, 'incoming')
})

let input_box = document.querySelector('#input-box')
let messageArea = document.querySelector('.message__area')
const form = document.getElementById('form')
var audio = new Audio('Notification.mp3')

function appendMessage(msg, type) {
    console.log(type);
    let mainDiv = document.createElement('div')
    let className = type
    mainDiv.classList.add(className, 'message')
    let markup = `<p>${msg}</p>`
    mainDiv.innerHTML = markup
    messageArea.appendChild(mainDiv)
    if(type=='incoming'){
        audio.play()
    }
}

form.addEventListener('submit',(e)=>{
    e.preventDefault()
    const msg = input_box.value;
    appendMessage(`You: ${msg}`, 'outgoing')
    socket.emit('send',msg);
    input_box.value='';
})
