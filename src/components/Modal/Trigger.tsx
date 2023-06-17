import * as Dialog from '@radix-ui/react-dialog'
import { ReactNode } from 'react'

interface TriggerProps {
  children: ReactNode
}

export const Trigger = ({ children }: TriggerProps) => {
  return <Dialog.Trigger asChild>{children}</Dialog.Trigger>
}
