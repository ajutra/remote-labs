import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, Trash2, KeyRound } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useState } from 'react'

const UserSettings: React.FC = () => {
  const { t } = useTranslation()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    success,
    sshKeys,
    newSshKey,
    setNewSshKey,
    handleSubmit,
    handleAddSshKey,
    handleRemoveSshKey,
  } = useUserSettings()

  const handlePasswordFormToggle = () => {
    setShowPasswordForm(!showPasswordForm)
    if (!showPasswordForm) {
      setPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card className="shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl">{t('User Settings')}</CardTitle>
          <CardDescription className="text-base">
            {t('Update your password and manage SSH keys')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
                <div>
                  <h3 className="text-xl font-medium">{t('Password')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('Change your account password')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePasswordFormToggle}
                  className="flex items-center gap-2 px-6"
                >
                  <KeyRound className="h-4 w-4" />
                  {showPasswordForm ? t('Cancel') : t('Change Password')}
                </Button>
              </div>

              {showPasswordForm && (
                <div className="space-y-6 rounded-lg border p-6 bg-muted/10">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-base">{t('New Password')}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('Enter new password')}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-base">
                        {t('Confirm New Password')}
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('Confirm new password')}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-xl font-medium">{t('SSH Public Keys')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('Manage your SSH keys for secure access')}
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    id="sshKey"
                    value={newSshKey}
                    onChange={(e) => setNewSshKey(e.target.value)}
                    placeholder={t('Paste your SSH public key here')}
                    className="h-10"
                  />
                  <Button type="button" onClick={handleAddSshKey} className="px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('Add')}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {sshKeys.map((key, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border p-4 bg-muted/20"
                  >
                    <code className="flex-1 overflow-x-auto text-sm">
                      {key}
                    </code>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t('Remove SSH Key')}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('Are you sure you want to remove this SSH key?')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveSshKey(index)}
                          >
                            {t('Remove')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
                {sshKeys.length === 0 && (
                  <div className="text-center py-8 bg-muted/10 rounded-lg">
                    <p className="text-muted-foreground">
                      {t('No SSH keys added yet')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-500 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-50 text-green-500 rounded-lg">
                {success}
              </div>
            )}
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-12 text-base"
            >
              {isLoading ? t('Saving...') : t('Save Changes')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserSettings
