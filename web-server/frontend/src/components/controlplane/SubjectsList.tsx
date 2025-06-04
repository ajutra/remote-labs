import { useAllSubjects } from '@/hooks/useAllSubjects'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { AppRoutes } from '@/enums/AppRoutes'
import { useState } from 'react'

const SubjectCard = ({ subject }: { subject: any }) => {
  const navigate = useNavigate()

  return (
    <Card
      className="cursor-pointer hover:bg-accent transition-colors"
      onClick={() => navigate(`${AppRoutes.SUBJECTS}/${subject.id}`)}
    >
      <CardHeader className="p-4">
        <CardTitle className="text-lg font-semibold truncate">{subject.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="truncate">Code: {subject.code}</p>
          <p className="truncate">Professor: {subject.professorName}</p>
          <p className="truncate">Email: {subject.professorMail}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function SubjectsList() {
  const { subjects, loading, error } = useAllSubjects()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div>Loading subjects...</div>
  }

  if (error) {
    return <div>Error loading subjects: {error}</div>
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
      <div className="space-y-4 px-0 pb-4 border-b">
        <h2 className="text-2xl font-bold">Subjects</h2>
        <Input
          type="search"
          placeholder="Search by subject name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {filteredSubjects.length === 0 ? (
            <p className="text-center text-muted-foreground">No subjects found</p>
          ) : (
            filteredSubjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))
          )}
        </div>
      </div>
    </div>
  )
} 