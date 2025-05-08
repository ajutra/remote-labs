import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useSubject } from '@/hooks/useSubject'
import { useSubjectVMs } from '@/hooks/useSubjectVMs'
import { useTemplates } from '@/hooks/useTemplates'
import useUserRole from '@/hooks/useUserRole'
import { SubjectInfo } from '@/components/subject/SubjectInfo'
import { VMDetails } from '@/components/vm/VMDetails'
import { TemplateSelector } from '@/components/vm/TemplateSelector'

const SubjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { subject, loading: subjectLoading } = useSubject(id!)
  const { vms, loading: vmsLoading, refresh: refreshVMs } = useSubjectVMs(id!)
  const { templates, loading: templatesLoading } = useTemplates(id!)
  const isTeacherOrAdmin = useUserRole()

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

      {/* Show VMs if they exist */}
      {vms.length > 0 && (
        <div className="mt-8 space-y-6">
          {vms.map((vm) => (
            <VMDetails
              key={vm.instanceId}
              vm={vm}
              onRefresh={refreshVMs}
              isTeacherOrAdmin={isTeacherOrAdmin}
            />
          ))}
        </div>
      )}

      {/* Show TemplateSelector if no VMs exist or user is teacher/admin */}
      {(vms.length === 0 || isTeacherOrAdmin) && (
        <div className="mt-8">
          <TemplateSelector
            templates={templates}
            loading={templatesLoading}
            subjectId={id!}
            onRequestSuccess={refreshVMs}
          />
        </div>
      )}
    </div>
  )
}

export default SubjectDetail
