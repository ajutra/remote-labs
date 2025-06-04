import useSubjects from '@/hooks/useSubjects'
import SubjectCard from '@/components/SubjectCard'
import CreateSubjectSheet from '@/components/CreateSubjectSheet'
import useUserRole from '@/hooks/useUserRole'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const Subjects: React.FC = () => {
  const { subjects, loading, error } = useSubjects()
  const isProfessorOrAdmin = useUserRole()

  const handleRefresh = () => {
    window.location.reload() // Simple refresh for now
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-4 text-2xl font-bold">Subjects</h1>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>
      {isProfessorOrAdmin && (
        <div className="mb-4 flex justify-end">
          <CreateSubjectSheet />
        </div>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>No Subjects Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You are not currently enrolled in any subjects. Subject professors are responsible for granting access to their students.
              Please contact your professor to get access to the relevant subjects.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid w-full flex-grow grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              id={subject.id}
              name={subject.name}
              code={subject.code}
              professorName={subject.professorName}
              professorMail={subject.professorMail}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Subjects
