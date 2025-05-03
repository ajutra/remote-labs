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
import { Plus, Trash2 } from 'lucide-react'
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

const UserSettings: React.FC = () => {
  const { t } = useTranslation()
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

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('User Settings')}</CardTitle>
          <CardDescription>
            {t('Update your password and manage SSH keys')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">{t('New Password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Enter new password')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t('Confirm New Password')}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('Confirm new password')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sshKey">{t('SSH Public Keys')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="sshKey"
                    value={newSshKey}
                    onChange={(e) => setNewSshKey(e.target.value)}
                    placeholder={t('Paste your SSH public key here')}
                  />
                  <Button type="button" onClick={handleAddSshKey}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-2">
                  {sshKeys.map((key, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg border p-2"
                    >
                      <code className="flex-1 overflow-x-auto text-sm">
                        {key}
                      </code>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t('Remove SSH Key')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t(
                                'Are you sure you want to remove this SSH key?'
                              )}
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
                    <p className="text-sm text-muted-foreground">
                      {t('No SSH keys added yet')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('Saving...') : t('Save Changes')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserSettings
