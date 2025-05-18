import { SubjectsList } from '@/components/controlplane/SubjectsList'
import UserManager from '@/components/controlplane/UserManager'
import InstanceManager from '@/components/controlplane/InstanceManager'
import ServerStatus from '@/components/controlplane/ServerStatus'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import CreateProfessorForm from '@/components/froms/CreateProfessorForm'
import { Plus } from 'lucide-react'

function ControlPlane() {
  const [showCreateProf, setShowCreateProf] = useState(false)

  return (
    <div className="container mx-auto py-8">
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
      <div className="grid min-h-[70vh] grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left sidebar: Subjects */}
        <aside className="flex h-[70vh] flex-col lg:col-span-3">
          <SubjectsList />
        </aside>
        {/* Center: Users and Instances, each half height */}
        <main className="flex h-[70vh] flex-col gap-6 lg:col-span-6">
          <section className="flex min-h-0 flex-1 flex-col">
            <UserManager />
          </section>
          <section className="flex min-h-0 flex-1 flex-col">
            <InstanceManager />
          </section>
        </main>
        {/* Right sidebar: Server status */}
        <aside className="flex h-[70vh] flex-col lg:col-span-3">
          <ServerStatus />
        </aside>
      </div>
    </div>
  )
}

export default ControlPlane
