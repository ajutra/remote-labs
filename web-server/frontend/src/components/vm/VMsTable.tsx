import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { VMListItem } from '@/types/vm'

interface VMsTableProps {
  vms: VMListItem[]
}

export const VMsTable = ({ vms }: VMsTableProps) => {
  const navigate = useNavigate()

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>OS</TableHead>
            <TableHead>Last Started</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vms.map((vm) => (
            <TableRow key={vm.id}>
              <TableCell className="font-medium">{vm.name}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{vm.subject.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {vm.subject.code}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      vm.status === 'running'
                        ? 'bg-green-500'
                        : vm.status === 'stopped'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                    }`}
                  />
                  <span className="capitalize">{vm.status}</span>
                </div>
              </TableCell>
              <TableCell>{vm.ipAddress}</TableCell>
              <TableCell>{vm.os}</TableCell>
              <TableCell>{vm.lastStarted}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/subjects/${vm.subject.id}`)}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
