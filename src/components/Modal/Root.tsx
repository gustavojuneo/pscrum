import * as Dialog from '@radix-ui/react-dialog'
import { ReactNode } from 'react'

interface RootProps {
  children: ReactNode
  visible?: boolean
  onOpenChange: (open: boolean) => void
  hasClose?: boolean
}

export const Root = ({
  children,
  visible = false,
  onOpenChange,
  hasClose = true,
}: RootProps) => {
  return (
    <Dialog.Root open={visible} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  )
}
