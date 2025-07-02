import { createContext, useContext, useState, ReactNode } from 'react'
import AlertDialog from '@/components/AlertDialog'

interface AlertDialogContextProps {
  showAlert: (title: string, description: string) => void
}

const AlertDialogContext = createContext<AlertDialogContextProps | undefined>(
  undefined
)

export const useAlertDialog = () => {
  const context = useContext(AlertDialogContext)
  if (!context) {
    throw new Error('useAlertDialog must be used within an AlertDialogProvider')
  }
  return context
}

export const AlertDialogProvider = ({ children }: { children: ReactNode }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogDescription, setDialogDescription] = useState('')

  const showAlert = (title: string, description: string) => {
    setDialogTitle(title)
    setDialogDescription(description)
    setIsDialogOpen(true)
  }

  const handleClose = () => {
    setIsDialogOpen(false)
  }

  return (
    <AlertDialogContext.Provider value={{ showAlert }}>
      {children}
      <AlertDialog
        isOpen={isDialogOpen}
        onClose={handleClose}
        title={dialogTitle}
        description={dialogDescription}
      />
    </AlertDialogContext.Provider>
  )
}
