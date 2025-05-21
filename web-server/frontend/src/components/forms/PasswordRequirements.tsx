import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PasswordRequirement {
  id: string
  label: string
  validator: (password: string) => boolean
}

interface PasswordRequirementsProps {
  password: string
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ password }) => {
  const { t } = useTranslation()

  const requirements: PasswordRequirement[] = [
    {
      id: 'length',
      label: t('At least 8 characters long'),
      validator: (pwd) => pwd.length >= 8,
    },
    {
      id: 'uppercase',
      label: t('Contains at least one uppercase letter'),
      validator: (pwd) => /[A-Z]/.test(pwd),
    },
    {
      id: 'lowercase',
      label: t('Contains at least one lowercase letter'),
      validator: (pwd) => /[a-z]/.test(pwd),
    },
    {
      id: 'number',
      label: t('Contains at least one number'),
      validator: (pwd) => /[0-9]/.test(pwd),
    },
    {
      id: 'special',
      label: t('Contains at least one special character'),
      validator: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    },
  ]

  const passwordRequirements = requirements.reduce((acc, req) => {
    acc[req.id] = req.validator(password)
    return acc
  }, {} as { [key: string]: boolean })

  return (
    <div className="mt-2 space-y-2">
      {requirements.map((req) => (
        <div key={req.id} className="flex items-center gap-2 text-sm">
          {passwordRequirements[req.id] ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span className={passwordRequirements[req.id] ? 'text-green-500' : 'text-red-500'}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export const isPasswordValid = (password: string): boolean => {
  const requirements: PasswordRequirement[] = [
    {
      id: 'length',
      label: '',
      validator: (pwd) => pwd.length >= 8,
    },
    {
      id: 'uppercase',
      label: '',
      validator: (pwd) => /[A-Z]/.test(pwd),
    },
    {
      id: 'lowercase',
      label: '',
      validator: (pwd) => /[a-z]/.test(pwd),
    },
    {
      id: 'number',
      label: '',
      validator: (pwd) => /[0-9]/.test(pwd),
    },
    {
      id: 'special',
      label: '',
      validator: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    },
  ]

  return requirements.every(req => req.validator(password))
} 