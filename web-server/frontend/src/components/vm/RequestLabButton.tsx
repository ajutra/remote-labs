import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2 } from 'lucide-react'

interface RequestLabButtonProps {
  onRequest: () => void
  loading: boolean
}

export const RequestLabButton = ({
  onRequest,
  loading,
}: RequestLabButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button className="w-full" onClick={onRequest} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Request Lab
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Request a new virtual machine for this subject</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
