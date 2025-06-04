import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface SubjectCardProps {
  id: string
  name: string
  code: string
  professorName?: string
  professorMail?: string
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  id,
  name,
  code,
  professorName,
  professorMail,
}) => {
  const navigate = useNavigate()

  return (
    <Card
      key={id}
      className="col-span-2 flex h-[250px] min-h-[200px] cursor-pointer flex-col justify-between bg-card p-4 text-card-foreground transition-colors hover:bg-accent"
      onClick={() => navigate(`/subjects/${id}`)}
    >
      <div>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Code: {code}</p>
          <p className="text-sm text-muted-foreground">
            Professor: {professorName} ({professorMail})
          </p>
        </CardContent>
      </div>
    </Card>
  )
}

export default SubjectCard
