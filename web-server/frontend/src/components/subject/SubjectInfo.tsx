import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Subject } from '@/types/subject'

interface SubjectInfoProps {
  subject: Subject
}

export const SubjectInfo = ({ subject }: SubjectInfoProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl">{subject.name}</CardTitle>
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
