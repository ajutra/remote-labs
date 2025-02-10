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
      <div className="mt-8 flex min-h-screen overflow-x-auto">
        <div className="flex min-w-max flex-row items-start gap-4">
          <div className="min-w-[300px]">
            <CreateUserForm />
          </div>
          <div className="min-w-[300px]">
            <CreateSubjectForm />
          </div>
          <div className="min-w-[300px]">
            <CreateProfessorForm />
          </div>
          <div className="min-w-[300px]">
            <ListAllSubjectsByUserForm />
          </div>
          <div className="min-w-[300px]">
            <ListAllUsersOfSubjectForm />
          </div>
          <div className="min-w-[300px]">
            <ValidateUserForm />
          </div>
          <div className="min-w-[300px]">
            <ListUserInfoForm />
          </div>
          <div className="min-w-[300px]">
            <AddUserToSubjectForm />
          </div>
          <div className="min-w-[300px]">
            <RemoveUserFromSubjectForm />
          </div>
          <div className="min-w-[300px]">
            <DeleteSubjectForm />
          </div>
          <div className="min-w-[300px]">
            <DeleteUserForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
