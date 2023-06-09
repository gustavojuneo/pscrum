import { Inter } from 'next/font/google'
import { useRouter } from 'next/router'
import { FormEvent, useCallback, useEffect, useState } from 'react'
const inter = Inter({ subsets: ['latin'] })

interface User {
  username: string
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
      className={`flex flex-col gap-10 h-screen w-screen items-center justify-center ${inter.className}`}
    >
      <div className="flex flex-col items-center">
        <h1 className="font-black text-4xl text-slate-800">
          <span className="text-blue-800">P</span>Scrum
        </h1>
        <span className="text-slate-800">
          Estimativa de tarefas de planejamentos.
        </span>
      </div>
      {user ? (
        <button>Criar nova sala</button>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <input
            type="text"
            name="username"
            placeholder="Digite o seu nome"
            className="w-full p-2 rounded"
          />
          <button
            type="submit"
            className="w-full p-2 bg-slate-800 rounded text-white hover:bg-slate-700 transition active:bg-slate-700"
          >
            Criar sala
          </button>
        </form>
      )}
    </main>
  )
}
