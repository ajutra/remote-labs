import React from 'react'

const SubjectList: React.FC = () => {
  return (
    <div className="flex h-full flex-col rounded bg-card p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Subjects</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search subject..."
          className="w-full rounded border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring"
        />
      </div>
      <div className="flex flex-1 items-center justify-center text-gray-400">
        {/* Subject list coming soon */}
        <span>Coming soon...</span>
      </div>
    </div>
  )
}

export default SubjectList
