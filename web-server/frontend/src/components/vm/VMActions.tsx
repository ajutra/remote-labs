import { Button } from '@/components/ui/button'
import { Loader2, KeyRound } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Copy } from 'lucide-react'
import { VM } from '@/types/subject'

interface VMActionsProps {
  vm: VM
  onAction: (action: 'start' | 'stop' | 'pause') => void
  loading: string | null
}

export const VMActions = ({ vm, onAction, loading }: VMActionsProps) => {
  const { toast } = useToast()

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
        onClick={() => onAction('start')}
        disabled={vm.status === 'running' || loading === 'start'}
      >
        {loading === 'start' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Start
      </Button>
      <Button
        variant="outline"
        className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
        onClick={() => onAction('stop')}
        disabled={vm.status === 'shut off' || loading === 'stop'}
      >
        {loading === 'stop' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Stop
      </Button>
      <Button
        variant="outline"
        className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800"
        onClick={() => onAction('pause')}
        disabled={vm.status === 'paused' || loading === 'pause'}
      >
        {loading === 'pause' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Pause
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          >
            <KeyRound className="mr-2 h-4 w-4" />
            WireGuard Config
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>WireGuard Configuration</DialogTitle>
            <DialogDescription>
              Copy this configuration to your WireGuard client to connect to the
              VM.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-4 text-sm text-slate-50">
              {vm.wireguardConfig}
            </pre>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={() => {
                navigator.clipboard.writeText(vm.wireguardConfig)
                toast({
                  title: 'Copied',
                  description: 'Configuration copied to clipboard',
                })
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
