import { Inter } from 'next/font/google'
import { useRouter } from 'next/router'
import { v4 as uuidV4 } from 'uuid'
import { FormEvent, useCallback, useEffect, useState } from 'react'
const inter = Inter({ subsets: ['latin'] })

interface User {
  username: string
  id: string
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  const createRoom = async () => {
    const roomCode = Math.floor(Math.random() * 899999 + 100000).toString()
    await router.push({
      pathname: '/room',
      query: {
        code: roomCode,
      },
    })
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { username } = event.currentTarget
    const createdUser: User = {
      id: uuidV4(),
      username: username.value,
    }
    setUser(createdUser)
    localStorage.setItem('@pscrum:user', JSON.stringify(createdUser))
    createRoom()
  }

  const loadUser = useCallback(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('@pscrum:user')
      const currentUser = saved ? JSON.parse(saved) : null
      setUser(currentUser)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  return (
    <main
      className={`flex h-screen w-screen flex-col items-center justify-center gap-10 ${inter.className}`}
    >
      <div className="flex flex-col items-center">
        <h1 className="text-4xl font-black text-slate-800">
          <span className="text-blue-800">P</span>Scrum
        </h1>
        <span className="text-slate-800">
          Estimativa de tarefas de planejamentos.
        </span>
      </div>
      {user ? (
        <div className="flex max-w-[320px] flex-col items-center gap-4">
          <h3 className="flex w-full flex-col items-center truncate text-2xl font-bold text-slate-800">
            Olá, <span className="text-xl font-medium">{user.username}</span>
          </h3>
          <button
            type="submit"
            onClick={createRoom}
            className="rounded-lg bg-slate-800 p-2 text-white transition hover:bg-slate-700"
          >
            Criar nova sala
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <input
            type="text"
            name="username"
            placeholder="Digite o seu nome"
            className="w-full rounded p-2"
          />
          <button
            type="submit"
            className="w-full rounded bg-slate-800 p-2 text-white transition hover:bg-slate-700 active:bg-slate-700"
          >
            Criar sala
          </button>
        </form>
      )}
    </main>
  )
}
