import { useAuth } from '@/context/AuthContext'

const useUserRole = () => {
  const { user } = useAuth()
  const isProfessorOrAdmin =
    user?.role === 'professor' || user?.role === 'admin'
  return isProfessorOrAdmin
}

export default useUserRole
