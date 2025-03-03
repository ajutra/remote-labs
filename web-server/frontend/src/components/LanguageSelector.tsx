import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const LanguageSelector: React.FC = () => {
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="language-selector">
      <Select onValueChange={changeLanguage}>
        <SelectTrigger className="bg-card text-card-foreground">
          <SelectValue placeholder={t('Language')} />
        </SelectTrigger>
        <SelectContent className="bg-card text-card-foreground">
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="ca">Català</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default LanguageSelector
