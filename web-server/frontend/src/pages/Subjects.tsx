import useSubjects from '@/hooks/useSubjects'
import SubjectCard from '@/components/SubjectCard'
import CreateSubjectSheet from '@/components/CreateSubjectSheet'
import useUserRole from '@/hooks/useUserRole'

const Subjects: React.FC = () => {
  const { subjects, loading, error } = useSubjects()
  const isProfessorOrAdmin = useUserRole()

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      <h1 className="mb-4 text-2xl font-bold">Subjects</h1>
      {isProfessorOrAdmin && (
        <div className="mb-4 flex justify-end">
          <CreateSubjectSheet />
        </div>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error}</div>
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
