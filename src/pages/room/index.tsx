import { LogOut, PlusCircle } from 'lucide-react'
import { Inter } from 'next/font/google'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { v4 as uuidV4 } from 'uuid'
import { UserCard } from '@/components/UserCard'
import { Modal } from '@/components/Modal'
import clsx from 'clsx'

const inter = Inter({ subsets: ['latin'] })

let socket: Socket | null = null

interface User {
  id: string
  username: string
}

interface Task {
  id: string
  name: string
  estimative?: number
}

interface CompletedUser {
  id: string
  username: string
  room: string
  socket_id: string
}

interface RoomData {
  room: any
  users: CompletedUser[]
  currentTask: Task
  votes: any
}

const voteValues = [1, 2, 3, 5, 8, 13, 20, 40, 100]

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomCode = searchParams.get('code')
  const [user, setUser] = useState<User | null>(null)
  const [usersInRoom, setUsersInRoom] = useState<CompletedUser[]>([])
  const [firstName, lastName] = user?.username.split(' ') || ['', '']
  const abbreviationUserName = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task>()
  const [tasksHistory, setTasksHistory] = useState<Task[]>([])
  const [votes, setVotes] = useState<any>([])
  const [fullSideBar] = useState(true)

  const enterRoom = () => {
    if (socket && roomCode && user?.id) {
      socket.emit('enter_room', { roomCode, user })
    }
  }

  const socketInitializer = async () => {
    const socketApi = process.env.SOCKET_API
    if (socketApi) {
      socket = io(socketApi)

      enterRoom()

      socket.on('vote', (data) => {
        console.log('vote >>>', data)
        setVotes((prevState: any) => [...prevState, data])
      })

      socket.on('room_data', (data: RoomData) => {
        setUsersInRoom(data.users)
        setCurrentTask(data.currentTask)
        setTasksHistory(data.room.tasks)
      })

      socket.on('user_disconnected', (data) => {
        const newUsersInRoom = usersInRoom.filter(
          (user) => user.socket_id !== data.socket_id,
        )
        setUsersInRoom(newUsersInRoom)
      })
    }
  }

  const handleVote = (voteValue: number) => {
    if (user && socket && currentTask) {
      const vote = {
        roomCode,
        taskId: currentTask.id,
        userId: user.id,
        vote: voteValue,
      }
      // setVotes((prevState: any) => [...prevState, vote])
      socket.emit('vote', vote)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { username } = event.currentTarget
    const createdUser: User = {
      id: uuidV4(),
      username: username.value,
    }
    setUser(createdUser)
    setShowCreateUser(false)
    localStorage.setItem('@pscrum:user', JSON.stringify(createdUser))
  }

  const loadUser = useCallback(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('@pscrum:user')
      if (!saved) {
        setShowCreateUser(true)
        return
      }
      const currentUser = JSON.parse(saved)
      setUser(currentUser)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('@pscrum:user')
    router.push('/')
  }

  const handleOpenCloseCreateTask = (open: boolean) => {
    setShowCreateTask(open)
  }

  const onCreateTask = (event: FormEvent<HTMLFormElement>) => {
    if (socket && roomCode) {
      event.preventDefault()
      const { taskName } = event.currentTarget
      const createdTask: Task = {
        id: uuidV4(),
        name: taskName.value,
        estimative: 10,
      }
      setCurrentTask(createdTask)
      setShowCreateTask(false)
      setTasksHistory((prevState) => [...prevState, createdTask])
      socket.emit('create_task', { task: createdTask, roomCode })
    }
  }

  useEffect(() => {
    if (user && roomCode && !socket) {
      socketInitializer()
    } else if (user && roomCode && socket) {
      enterRoom()
    }

    return () => {
      if (socket) socket.disconnect()
      socket = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomCode])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  return (
    <main className={`flex h-screen w-screen ${inter.className}`}>
      <aside className="flex w-[200px] flex-col px-4 py-10">
        <header className="flex w-full items-center gap-4">
          <div className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-full bg-slate-800 p-2 text-xl font-bold text-white">
            {abbreviationUserName}
          </div>
          <span className="truncate">{user?.username ?? 'Sem usuário'}</span>
        </header>
        <main className="mt-10">
          <ul>
            <li
              className="flex cursor-pointer items-center gap-2 text-slate-900 transition hover:text-blue-800"
              onClick={() => handleOpenCloseCreateTask(true)}
            >
              <PlusCircle size={16} />
              Nova Tarefa
            </li>
          </ul>
        </main>
        <footer className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-800 transition hover:text-red-800"
          >
            <LogOut size={20} />
            Sair
          </button>
        </footer>
      </aside>
      <section className="flex flex-1 flex-col items-center">
        <h1 className="mt-10 text-4xl font-bold text-slate-800">
          {currentTask?.name}
        </h1>
        {currentTask?.id ? (
          <div className="flex h-full flex-col overflow-hidden">
            <section className="flex h-full w-full flex-wrap items-center justify-center gap-6 overflow-auto px-4 py-10">
              {usersInRoom
                .filter((u) => u.id !== user?.id)
                .map((user) => (
                  <UserCard
                    key={user.socket_id}
                    currentTask={currentTask}
                    user={user}
                    votes={votes}
                  />
                ))}
            </section>
            <ul className="flex w-full items-center justify-center gap-1 py-4">
              {voteValues.map((vote) => (
                <li
                  key={vote}
                  role="button"
                  onClick={() => handleVote(vote)}
                  className="flex w-24 cursor-pointer items-center justify-center rounded bg-slate-800 px-4 py-6 text-lg font-bold text-white transition hover:bg-slate-700"
                >
                  {vote}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <span className="text-3xl font-bold">Nenhuma tarefa criada.</span>
            <p>
              Antes de iniciar a votação é necessário criar uma tarefa ao lado.
            </p>
          </div>
        )}
        <div></div>
      </section>
      <aside
        className={clsx('flex max-h-full flex-col bg-zinc-200 duration-300', {
          'w-72': fullSideBar,
          'w-12 overflow-hidden': !fullSideBar,
        })}
      >
        <header className="relative flex items-center px-4">
          {/* <button
            className={clsx('absolute rounded-full bg-zinc-300 p-2', {
              'left-1/2 -translate-x-1/2': !fullSideBar,
              '-left-6': fullSideBar,
            })}
            // onClick={() => setFullSideBar((prevState) => !prevState)}
          >
            <ChevronsRight
              size={20}
              className={clsx({
                'rotate-180': !fullSideBar,
              })}
            />
          </button> */}
          <h3
            className={clsx('z-100 my-4 text-lg font-bold', {
              'pointer-events-none invisible': !fullSideBar,
            })}
          >
            Histórico
          </h3>
        </header>
        <div
          className={clsx('overflow-x-auto', {
            'pointer-events-none invisible overflow-hidden': !fullSideBar,
          })}
        >
          <table className="h-full min-w-full text-left text-sm text-slate-800">
            <thead className="sticky top-0 rounded bg-gray-300 text-xs text-slate-900">
              <tr>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Estimativa</th>
              </tr>
            </thead>
            <tbody className="h-full w-full divide-y divide-gray-300 overflow-y-scroll">
              {tasksHistory.map((task) => (
                <tr key={task.id} className="w-full">
                  <td className="px-6 py-4">{task.name}</td>
                  <td className="px-6 py-4">{task.estimative} pontos</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>
      <Modal.Root visible={showCreateUser} onOpenChange={() => {}}>
        <Modal.Content hasClose={false} title="Acesse com seu nome">
          <div>
            <form onSubmit={onSubmit} className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Digite seu nome"
                name="username"
                autoComplete="new-password"
                className="w-full rounded border-2 border-slate-800 p-2 outline-none"
              />
              <button
                type="submit"
                className="w-full rounded bg-slate-800 p-2 text-white transition hover:bg-slate-700 active:bg-slate-700"
              >
                Entrar na sala
              </button>
            </form>
          </div>
        </Modal.Content>
      </Modal.Root>
      <Modal.Root
        visible={showCreateTask}
        onOpenChange={handleOpenCloseCreateTask}
      >
        <Modal.Content hasClose={false} title="Nova tarefa">
          <div>
            <form onSubmit={onCreateTask} className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Digite o nome da tarefa"
                name="taskName"
                autoComplete="new-password"
                className="w-full rounded border-2 border-slate-800 p-2 outline-none"
              />
              <button
                type="submit"
                className="w-full rounded bg-slate-800 p-2 text-white transition hover:bg-slate-700 active:bg-slate-700"
              >
                Criar Tarefa
              </button>
            </form>
          </div>
        </Modal.Content>
      </Modal.Root>
    </main>
  )
}
