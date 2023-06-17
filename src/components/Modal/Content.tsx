import * as Dialog from '@radix-ui/react-dialog'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface DialogProps {
  children: ReactNode
  title?: string
  hasClose?: boolean
}

export const Content = ({ children, title, hasClose = true }: DialogProps) => {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/20" />
      <Dialog.Content
        className={clsx(
          'fixed left-1/2 top-1/2 flex w-[calc(100%-3rem)] max-w-[512px] -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-xl bg-zinc-50 p-6',
          {
            'pt-4': hasClose || !!title,
          },
        )}
      >
        {(!!title || hasClose) && (
          <header className="mb-4 flex items-center justify-between gap-4">
            {title && (
              <h2 className="w-full truncate text-2xl font-bold">{title}</h2>
            )}
            {hasClose && (
              <Dialog.Close className="ml-auto">
                <X size={24} />
              </Dialog.Close>
            )}
          </header>
        )}
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}
