import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Subject } from '@/types/subject'
import useUserRole from '@/hooks/useUserRole'
import { DeleteSubjectButton } from './DeleteSubjectButton'

interface SubjectInfoProps {
  subject: Subject
}

export const SubjectInfo = ({ subject }: SubjectInfoProps) => {
  const isProfessorOrAdmin = useUserRole()

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{subject.name}</CardTitle>
          {isProfessorOrAdmin && <DeleteSubjectButton subjectId={subject.id} />}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Code: {subject.code}</p>
        <p className="text-muted-foreground">
          Professor: {subject.professorName} ({subject.professorMail})
        </p>
      </CardContent>
    </Card>
  )
}
