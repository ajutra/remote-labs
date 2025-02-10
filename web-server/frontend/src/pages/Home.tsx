import CreateProfessorForm from '@/components/froms/CreateProfessorForm'
import CreateSubjectForm from '@/components/froms/CreateSubjectForm'
import CreateUserForm from '@/components/froms/CreateUserForm'
import ListAllSubjectsByUserForm from '@/components/froms/ListAllSubjectsByUserForm'
import ListAllUsersOfSubjectForm from '@/components/froms/ListAllUsersOfSubjectForm'
import ListUserInfoForm from '@/components/froms/ListUsersInfoForm'
import ValidateUserForm from '@/components/froms/ValidateUserForm'
import AddUserToSubjectForm from '@/components/froms/AddUserToSubjectForm'
import DeleteSubjectForm from '@/components/froms/DeleteSubjectForm'
import DeleteUserForm from '@/components/froms/DeleteUserForm'
import RemoveUserFromSubjectForm from '@/components/froms/RemoveUserFromSubjectFrom'
import '@/i18n'
import Header from '@/components/Header'
import PhotoCarousel from '@/components/PhotoCarousel'

function Home() {
  return (
    <div>
      <Header />
      <PhotoCarousel />
      <div className="mt-8 flex min-h-screen flex-wrap gap-4">
        <div className="flex w-full flex-wrap items-start gap-4">
          <div className="min-w-[300px] flex-1">
            <CreateUserForm />
          </div>
          <div className="min-w-[300px] flex-1">
            <CreateSubjectForm />
          </div>
          <div className="min-w-[300px] flex-1">
            <CreateProfessorForm />
          </div>
          <div className="min-w-[300px] flex-1">
            <ListAllSubjectsByUserForm />
          </div>
          <div className="min-w-[300px] flex-1">
            <ListAllUsersOfSubjectForm />
          </div>
          <div className="min-w-[300px] flex-1">
            <ValidateUserForm />
          </div>
          <div className="min-w-[300px] flex-1">
            <ListUserInfoForm />
          </div>
          <div className="min-w-[300px] flex-1">
            <AddUserToSubjectForm />
          </div>
          <div className="min-w-[300px] flex-1">
            <RemoveUserFromSubjectForm />
          </div>
          <div className="min-w-[300px] flex-1">
            <DeleteSubjectForm />
          </div>
          <div className="min-w-[300px] flex-1">
            <DeleteUserForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
