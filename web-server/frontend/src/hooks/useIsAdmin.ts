import { useAuth } from '@/context/AuthContext'

const useIsAdmin = () => {
  const { user } = useAuth()
  return user?.role === 'admin'
}

export default useIsAdmin
