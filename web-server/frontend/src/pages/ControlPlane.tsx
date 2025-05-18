import { SubjectsList } from '@/components/controlplane/SubjectsList'
import UserManager from '@/components/controlplane/UserManager'
import ServerStatus from '@/components/controlplane/ServerStatus'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import CreateProfessorForm from '@/components/froms/CreateProfessorForm'
import { Plus } from 'lucide-react'

function ControlPlane() {
  const [showCreateProf, setShowCreateProf] = useState(false)

  return (
    <div className="container mx-auto min-h-screen py-8">
      <Button
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-full bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
        onClick={() => setShowCreateProf(true)}
      >
        <Plus className="h-6 w-6" />
        Create Professor
      </Button>
      {showCreateProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-md rounded-xl bg-card p-6 shadow-2xl">
            <button
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowCreateProf(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <CreateProfessorForm />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-6">
        {/* Server Status at the top */}
        <div className="min-h-[300px]">
          <ServerStatus />
        </div>
        
        {/* Main content area */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left sidebar: Subjects */}
          <aside className="lg:col-span-3">
            <div className="h-full min-h-[500px]">
              <SubjectsList />
            </div>
          </aside>
          {/* Center: Users with their instances */}
          <main className="lg:col-span-9">
            <div className="h-full min-h-[500px]">
              <UserManager />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default ControlPlane
