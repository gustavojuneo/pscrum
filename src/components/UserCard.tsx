import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'

export const UserCard = ({ user, votes = [] }: any) => {
  const [timeFinish, setTimeFinish] = useState(false)
  // eslint-disable-next-line no-undef
  const timeout = useRef<NodeJS.Timeout>()
  const userAlreadyVoted = votes.some(
    (vote: any) => vote.username === user.username,
  )
  const frontCardClass = clsx(
    'absolute backface-hidden border-2 w-full h-full bg-gray-100 rounded-xl flex flex-col items-center justify-center',
  )

  useEffect(() => {
    if (userAlreadyVoted) {
      timeout.current = setTimeout(() => {
        setTimeFinish(true)
      }, 2000)
    }

    return () => {
      if (timeout.current) clearTimeout(timeout.current)
    }
  }, [userAlreadyVoted])

  return (
    <article className="h-72 w-56 perspective" key={user.socket_id}>
      <div
        className={clsx(
          'relative h-full w-full rounded-xl preserve-3d duration-500',
          {
            'flip-180': userAlreadyVoted && !timeFinish,
          },
        )}
      >
        <div className={frontCardClass}>
          <span>{user.username}</span>
          {timeFinish ? '20' : 'Ainda não votou'}
        </div>
        <div
          className={clsx(
            'absolute backface-hidden flip-180 w-full h-full bg-gray-100 rounded-xl overflow-hidden flex flex-col items-center justify-center',
          )}
        >
          <span>{user.username}</span>
          Votou
        </div>
      </div>
    </article>
  )
}

// flex flex-col items-center justify-center p-4 bg-slate-800 text-white rounded w-[200px] h-[300px]
