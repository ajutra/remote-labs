import { useTranslation } from 'react-i18next'

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="language-selector">
      <button
        onClick={() => changeLanguage('en')}
        className="m-2 rounded bg-primary px-4 py-2 text-primary-foreground"
      >
        English
      </button>
      <button
        onClick={() => changeLanguage('es')}
        className="m-2 rounded bg-primary px-4 py-2 text-primary-foreground"
      >
        Español
      </button>
      <button
        onClick={() => changeLanguage('ca')}
        className="m-2 rounded bg-primary px-4 py-2 text-primary-foreground"
      >
        Català
      </button>
    </div>
  )
}

export default LanguageSelector
