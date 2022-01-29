const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

// const httpServer = require('http').createServer(app);

// const io = require("socket.io")(httpServer, {
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"],
//       allowedHeaders: ["my-custom-header"],
//       credentials: true
//     }
//   });


const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/joinChat', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId)

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })

  // chat functions 
  const users = {}
  socket.on('new-user-joined', name => {
    users[socket.id] = name;
    socket.broadcast.emit('user-joined', name)
  });

  socket.on('send', message => {
    socket.broadcast.emit('recieve', { message: message, name: users[socket.id] })
  });

  socket.on('disconnect', name => {
    socket.broadcast.emit('left', users[socket.id])
    delete users[socket.id]
  });

})

const port = process.env.PORT || 3000
server.listen(port, console.log(`app started on ${port}`))
