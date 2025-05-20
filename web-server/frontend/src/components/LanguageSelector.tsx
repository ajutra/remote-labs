import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { LanguagesIcon } from 'lucide-react'

// Previous language selector implementation
/*
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
*/

const LanguageSelector: React.FC = () => {
  return (
    <div className="language-selector">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <LanguagesIcon className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-[250px]">
              We are currently translating our content to better communicate in your language. 
              For now, please use your browser's built-in translation feature.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export default LanguageSelector
