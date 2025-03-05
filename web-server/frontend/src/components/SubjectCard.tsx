import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
  return (
    <Card
      key={id}
      className="col-span-2 flex h-[250px] min-h-[200px] flex-col justify-between bg-card p-4 text-card-foreground"
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
      <CardFooter className="flex justify-end">
        <Button className="w-full sm:w-auto">Request Lab</Button>
      </CardFooter>
    </Card>
  )
}

export default SubjectCard
