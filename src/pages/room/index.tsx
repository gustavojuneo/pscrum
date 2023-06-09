// import { UserCard } from '@/components/UserCard'
import clsx from 'clsx'
import { LogOut, PlusCircle } from 'lucide-react'
import { Inter } from 'next/font/google'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const inter = Inter({ subsets: ['latin'] })

let socket: Socket

interface User {
  username: string
}

interface CompletedUser {
  username: string
  room: string
  socket_id: string
}

const voteValues = [1, 2, 3, 5, 8, 13, 20, 40, 100]

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const room = searchParams.get('code')
  const isChangingRoute = useRef(false)
  const [user, setUser] = useState<User | null>(null)
  const [usersInRoom, setUsersInRoom] = useState<CompletedUser[]>([])
  const [firstName, lastName] = user?.username.split(' ') || ['', '']
  const abbreviationUserName = `${firstName?.[0]}${lastName?.[0] ?? ''}`
  const [, setVotes] = useState<any>([])

  const socketInitializer = async () => {
    await fetch('/api/socket')

    socket = io({
      path: '/api/socket',
      addTrailingSlash: false,
    })
  }

  const enterRoom = useCallback(() => {
    if (socket && room && user?.username) {
      socket.emit('enter_room', { room, username: user?.username })
    }
  }, [room, user?.username])

  const handleVote = (voteValue: number) => {
    if (user) {
      const vote = {
        room,
        username: user?.username,
        task: '1',
        vote: voteValue,
      }
      setVotes((prevState: any) => [...prevState, vote])
      socket.emit('vote', vote)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { username } = event.currentTarget
    const createdUser: User = {
      username: username.value,
    }
    setUser(createdUser)
    enterRoom()
    localStorage.setItem('@pscrum:user', JSON.stringify(createdUser))
  }

  const loadUser = useCallback(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('@pscrum:user')
      if (!saved) {
        if (!isChangingRoute.current) {
          router.push('/')
          isChangingRoute.current = true
        }
        return
      }
      const currentUser = JSON.parse(saved)
      setUser(currentUser)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('@pscrum:user')
    router.push('/')
  }

  useEffect(() => {
    if (user) {
      socketInitializer()
    }

    return () => {
      if (socket) socket.disconnect()
    }
  }, [user])

  useEffect(() => {
    if (socket && user) {
      socket.on('vote', (data) => {
        setVotes((prevState: any) => [...prevState, data])
      })

      socket.on('room_data', (data) => {
        setUsersInRoom(data.users)
        setVotes(data.votes)
      })

      socket.on('user_disconnected', (data) => {
        const newUsersInRoom = usersInRoom.filter(
          (user) => user.socket_id !== data.socket_id,
        )
        setUsersInRoom(newUsersInRoom)
      })
    }
  }, [user, usersInRoom, enterRoom])

  useEffect(() => {
    loadUser()
    enterRoom()
  }, [loadUser, enterRoom])

  return (
    <main className={`flex h-screen w-screen ${inter.className}`}>
      {user && (
        <aside className="w-[200px] py-10 px-4 flex flex-col">
          <header className="flex items-center gap-4 w-full">
            <div className="w-[44px] h-[44px] p-2 bg-slate-800 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xl">
              {abbreviationUserName}
            </div>
            <span className="truncate">{user?.username}</span>
          </header>
          <main className="mt-10">
            <ul>
              <li className="flex items-center gap-2 text-slate-900 hover:text-blue-800 cursor-pointer transition">
                <PlusCircle size={16} />
                Nova Tarefa
              </li>
            </ul>
          </main>
          <footer className="mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-800 hover:text-red-800 transition"
            >
              <LogOut size={20} />
              Sair
            </button>
          </footer>
        </aside>
      )}
      <section className="flex-1 flex flex-col items-center">
        <h1 className="mt-10 font-bold text-4xl text-slate-800">Tarefa....</h1>
        {!user ? (
          <div>
            <form onSubmit={onSubmit}>
              <input
                type="text"
                placeholder="Digite seu nome"
                name="username"
                autoComplete="new-password"
              />
              <button type="submit">Entrar na sala</button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <section className="w-full h-full flex justify-center items-center flex-wrap gap-6 overflow-auto px-4 py-10">
              {Array(5)
                .fill(0)
                .map((_, index) => (
                  <article key={index} className="h-72 w-56">
                    <div
                      className={clsx(
                        'relative h-full w-full rounded-xl preserve-3d duration-500',
                      )}
                    >
                      <div
                        className={clsx(
                          'absolute backface-hidden w-full h-full bg-gray-100 rounded-xl overflow-hidden flex flex-col items-center justify-center',
                        )}
                      >
                        <span>{user.username}</span>
                        Votou
                      </div>
                    </div>
                  </article>
                ))}
              {/* {usersInRoom
                .filter((u) => u.username !== user.username)
                .map((user) => (
                  <UserCard key={user.socket_id} user={user} votes={votes} />
                ))} */}
            </section>
            <ul className="w-full py-4 flex gap-1 justify-center items-center">
              {voteValues.map((vote) => (
                <li
                  key={vote}
                  role="button"
                  onClick={() => handleVote(vote)}
                  className="px-4 w-24 py-6 bg-slate-800 rounded text-white flex justify-center items-center font-bold text-lg hover:bg-slate-700 transition cursor-pointer"
                >
                  {vote}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  )
}
