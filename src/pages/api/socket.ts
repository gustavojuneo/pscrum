import { Server } from 'socket.io'

interface RoomUser {
  socket_id: string
  username: string
  room: string
}

interface Vote {
  room: string
  createdAt: Date
  task: string
  value: number
  username: string
}

const users: RoomUser[] = []
const votes: Vote[] = []

export default function handler(req: Request, res: any) {
  if (res.socket.server.io) {
    console.log('Server already started!')
    res.end()
    return
  }

  const io = new Server(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
  })
  res.socket.server.io = io

  io.on('connection', (socket: any) => {
    socket.on('enter_room', (data: any) => {
      socket.join(data.room)
      const userInRoom = users.find(
        (user) => user.username === data.username && data.room === user.room,
      )
      if (userInRoom) {
        userInRoom.socket_id = socket.id
      } else if (data.username) {
        users.push({
          room: data.room,
          socket_id: socket.id,
          username: data.username,
        })
      }

      io.to(data.room).emit('room_data', { users, votes })
    })
    socket.on('vote', (data: any) => {
      const vote: Vote = {
        room: data.room,
        task: data.task,
        value: data.vote,
        username: data.username,
        createdAt: new Date(),
      }
      votes.push(vote)
      io.to(data.room).emit('vote', vote)
    })

    socket.on('disconnect', () => {
      const userIndex = users.findIndex((user) => user.socket_id === socket.id)
      if (userIndex !== -1) {
        const user = { ...users[userIndex] }
        users.splice(userIndex, 1)
        io.to(user.room).emit('user_disconnected', user)
      }
    })
  })

  console.log('Socket server started successfully!')
  res.end()
}
