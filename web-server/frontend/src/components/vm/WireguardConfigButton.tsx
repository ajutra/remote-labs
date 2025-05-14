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

  const handleCopyToClipboard = () => {
    if (config) {
      navigator.clipboard.writeText(config)
    }
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
          <Textarea
            readOnly
            value={config || ''}
            className="h-40"
            id="wireguard-config-description"
          />
          <DialogFooter>
            <Button onClick={handleCopyToClipboard} variant="outline">
              <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
