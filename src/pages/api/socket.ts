import { Server } from 'socket.io'

interface User {
  socket_id: string
  id: string
  username: string
  roomCodes: string[]
}

interface Vote {
  createdAt: Date
  estimative: number
  userId: string
}

interface Task {
  id: string
  name: string
  votes: Vote[]
  estimative?: number
}

interface Room {
  code: string
  scrumMaster?: string
  tasks: Task[]
  currentTaskId?: string
  userIds: string[]
}

const rooms: Room[] = []
const users: User[] = []

export default function handler(req: Request, res: any) {
  if (res.socket.server.io) {
    console.log('Server already started!')
    res.end()
    return
  }

  const io = new Server(res.socket.server, {
    path: '/api/socket',
  })
  res.socket.server.io = io

  io.on('connection', (socket: any) => {
    console.log('users >>>', users)
    socket.on('enter_room', (data: any) => {
      const user: User = data.user
      const room: Room = rooms.find((r) => r.code === data.roomCode) || {
        code: data.roomCode,
        scrumMaster: user.id,
        userIds: [user.id],
        tasks: [],
      }

      const userInRoom = room.userIds.includes(user.id)
      if (!userInRoom) {
        room.userIds.push(user.id)
      }

      const userExist = users.find((u) => u.id === user.id)
      if (userExist) {
        userExist.socket_id = socket.id
        const userInRoom = userExist.roomCodes.includes(room.code)
        if (!userInRoom) {
          userExist.roomCodes.push(room.code)
        }
      } else if (data.user.id) {
        users.push({
          ...user,
          socket_id: socket.id,
          roomCodes: [room.code],
        })
      }

      if (!rooms.find((r) => r.code === room.code)) {
        rooms.push(room)
      }

      const usersInRoom = users.filter((u) => room.userIds.includes(u.id))
      const currentTask = room.tasks[room.tasks.length - 1]

      socket.join(room.code)
      io.to(room.code).emit('room_data', {
        room,
        currentTask,
        users: usersInRoom,
      })
    })

    socket.on('create_task', (data: any) => {
      const room = rooms.find((r) => r.code === data.roomCode)
      if (room) {
        const usersInRoom = users.filter((u) => room.userIds.includes(u.id))

        room.tasks.push(data.task)
        io.to(room.code).emit('room_data', {
          room,
          currentTask: data.task,
          users: usersInRoom,
        })
      }
    })

    socket.on('vote', (data: any) => {
      const task = rooms
        .find((r) => r.code === data.roomCode)
        ?.tasks.find((t) => t.id === data.taskId)

      if (task) {
        const vote: Vote = {
          estimative: data.vote,
          userId: data.userId,
          createdAt: new Date(),
        }
        const voteIndex = task.votes?.findIndex((v) => v.userId === data.userId)

        if (task.votes?.length > 0) {
          if (voteIndex !== -1) {
            task.votes.splice(voteIndex, 1)
            task.votes.push(vote)
          } else {
            task.votes.push(vote)
          }
        } else {
          task.votes = [vote]
        }

        io.to(data.roomCode).emit('vote', { ...vote, taskId: data.taskId })
      }
    })

    socket.on('disconnect', () => {
      const userIndex = users.findIndex((user) => user.socket_id === socket.id)
      if (userIndex !== -1) {
        const user = { ...users[userIndex] }
        users.splice(userIndex, 1)

        user.roomCodes.forEach((code) => {
          io.to(code).emit('user_disconnected', user)
        })
      }
    })
  })

  console.log('Socket server started successfully!')
  return res.end()
}
