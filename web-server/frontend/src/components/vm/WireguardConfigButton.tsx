import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useWireguardConfig } from '@/hooks/useWireguardConfig'
import { Copy } from 'lucide-react'

interface WireguardConfigButtonProps {
  instanceId: string
}

export const WireguardConfigButton: React.FC<WireguardConfigButtonProps> = ({
  instanceId,
}) => {
  const [open, setOpen] = useState(false)
  const { getConfig, isLoading, config } = useWireguardConfig()

  const handleFetchConfig = async () => {
    await getConfig(instanceId)
    setOpen(true)
  }

  const handleCopyToClipboard = async () => {
    if (!config) return

    try {
      await navigator.clipboard.writeText(config)
      alert('Configuration copied to clipboard')
    } catch (err) {
      alert('Error copying configuration. You can also select and copy the text directly from the text area.')
    }
  }

  const getSSHInfo = (config: string) => {
    const addressMatch = config.match(/Address = (\d+\.\d+\.\d+\.\d+)\/\d+/)
    if (!addressMatch) return null

    const ip = addressMatch[1]
    const parts = ip.split('.')
    parts[1] = '0' // Replace second octet with 0
    return parts.join('.')
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
        onClick={handleFetchConfig}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Wireguard Config'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby="wireguard-config-description">
          <DialogHeader>
            <DialogTitle>Wireguard Configuration</DialogTitle>
          </DialogHeader>
          {config && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  readOnly
                  value={config}
                  className="h-40 font-mono text-sm"
                  id="wireguard-config-description"
                />
                <Button onClick={handleCopyToClipboard} variant="outline" className="w-full">
                  <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
                </Button>
              </div>
              <div className="rounded-md bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Next step:</span> Once connected to the VPN, you can access the instance via SSH using:
                  <br />
                  <span className="font-mono font-bold mt-2 block">
                    {getSSHInfo(config)}
                  </span>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
