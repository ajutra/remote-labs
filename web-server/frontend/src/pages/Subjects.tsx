import 'i18next'

const subjects = [
  { id: 1, name: 'Mathematics' },
  { id: 2, name: 'Physics' },
  { id: 3, name: 'Chemistry' },
  { id: 4, name: 'Biology' },
  { id: 5, name: 'History' },
  { id: 6, name: 'Geography' },
  { id: 7, name: 'Literature' },
  { id: 8, name: 'Art' },
  { id: 9, name: 'Computer Science' },
  { id: 10, name: 'Music' },
  { id: 11, name: 'Physical Education' },
  { id: 12, name: 'Philosophy' },
  { id: 13, name: 'Economics' },
  { id: 14, name: 'Psychology' },
  { id: 15, name: 'Sociology' },
  { id: 16, name: 'Political Science' },
  { id: 17, name: 'Law' },
  { id: 18, name: 'Business' },
  { id: 19, name: 'Marketing' },
  { id: 20, name: 'Management' },
  { id: 21, name: 'Accounting' },
  { id: 22, name: 'Finance' },
  { id: 23, name: 'Engineering' },
  { id: 24, name: 'Medicine' },
  { id: 25, name: 'Nursing' },
  { id: 26, name: 'Dentistry' },
  { id: 27, name: 'Pharmacy' },
  { id: 28, name: 'Veterinary' },
  { id: 29, name: 'Agriculture' },
  { id: 30, name: 'Architecture' },
  { id: 31, name: 'Construction' },
  { id: 32, name: 'Urban Planning' },
  { id: 33, name: 'Environmental Science' },
  { id: 34, name: 'Forestry' },
  { id: 35, name: 'Oceanography' },
  { id: 36, name: 'Meteorology' },
  { id: 37, name: 'Astronomy' },
  { id: 38, name: 'Geology' },
  { id: 39, name: 'Biology' },
  { id: 40, name: 'Chemistry' },
  { id: 41, name: 'Physics' },
  { id: 42, name: 'Mathematics' },
  { id: 43, name: 'Computer Science' },
  { id: 44, name: 'Engineering' },
  { id: 45, name: 'Medicine' },
  { id: 46, name: 'Nursing' },
  { id: 47, name: 'Dentistry' },
  { id: 48, name: 'Pharmacy' },
  { id: 49, name: 'Veterinary' },
  { id: 50, name: 'Agriculture' },
  { id: 51, name: 'Architecture' },
  { id: 52, name: 'Construction' },
]

function Subjects() {
  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      <h1 className="mb-4 text-2xl font-bold">Subjects</h1>
      <div className="grid w-full flex-grow grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="flex h-full w-full items-center justify-center rounded border p-4 shadow"
          >
            <h2 className="text-xl font-semibold">{subject.name}</h2>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Subjects
