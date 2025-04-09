import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useSubject } from '@/hooks/useSubject'
import { useVM } from '@/hooks/useVM'
import { SubjectInfo } from '@/components/subject/SubjectInfo'
import { VMInfo } from '@/components/vm/VMInfo'
import { VMActions } from '@/components/vm/VMActions'
import { RequestLabButton } from '@/components/vm/RequestLabButton'

const SubjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { subject, loading: subjectLoading } = useSubject(id!)
  const { vm, requestingLab, vmActionLoading, requestLab, handleVMAction } =
    useVM(id!)

  if (subjectLoading) {
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

      {vm ? (
        <>
          <VMInfo vm={vm} />
          <div className="mt-4">
            <VMActions
              vm={vm}
              onAction={handleVMAction}
              loading={vmActionLoading}
            />
          </div>
        </>
      ) : (
        <RequestLabButton onRequest={requestLab} loading={requestingLab} />
      )}
    </div>
  )
}

export default SubjectDetail
