import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useSubject } from '@/hooks/useSubject'
import { useSubjectVMs } from '@/hooks/useSubjectVMs'
import { useTemplates } from '@/hooks/useTemplates'
import { SubjectInfo } from '@/components/subject/SubjectInfo'
import { TemplateSelector } from '@/components/vm/TemplateSelector'
import { VMDetails } from '@/components/vm/VMDetails'
import { useToast } from '@/hooks/use-toast'

const SubjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { subject, loading: subjectLoading } = useSubject(id!)
  const { vms, loading: vmsLoading, refresh: refreshVMs } = useSubjectVMs(id!)
  const { templates, loading: templatesLoading } = useTemplates(id!)
  const [isActionLoading, setIsActionLoading] = useState(false)

  if (subjectLoading || vmsLoading || templatesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!subject) {
    return <div>Subject not found</div>
  }

  const handleRequestLab = async (templateId: string) => {
    try {
      const response = await fetch('http://localhost:8080/instances/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId: id,
          templateId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to request lab')
      }

      await refreshVMs()
      toast({
        title: 'Success',
        description: 'Lab requested successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to request lab',
        variant: 'destructive',
      })
    }
  }

  const handleVMAction = async (
    action: 'start' | 'stop' | 'delete',
    instanceId: string
  ) => {
    setIsActionLoading(true)
    try {
      const response = await fetch(
        `http://localhost:8080/instances/${action}/${instanceId}`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to ${action} VM`)
      }

      await refreshVMs()
      toast({
        title: 'Success',
        description: `VM ${action}ed successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} VM`,
        variant: 'destructive',
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="outline"
        onClick={() => navigate('/subjects')}
        className="mb-4"
      >
        Back to Subjects
      </Button>

      <SubjectInfo subject={subject} />

      {vms.length > 0 ? (
        <div className="mt-8 space-y-6">
          {vms.map((vm) => (
            <VMDetails
              key={vm.instanceId}
              vm={vm}
              onRefresh={refreshVMs}
              onStart={() => handleVMAction('start', vm.instanceId)}
              onStop={() => handleVMAction('stop', vm.instanceId)}
              onDelete={() => handleVMAction('delete', vm.instanceId)}
              isActionLoading={isActionLoading}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <TemplateSelector
            templates={templates}
            loading={templatesLoading}
            onRequest={handleRequestLab}
          />
        </div>
      )}
    </div>
  )
}

export default SubjectDetail
