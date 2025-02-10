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

function Home() {
  return (
    <div>
      <Header />
      <div className="mt-8 flex min-h-screen flex-row items-start gap-2">
        <CreateUserForm />
        <CreateSubjectForm />
        <CreateProfessorForm />
        <ListAllSubjectsByUserForm />
        <ListAllUsersOfSubjectForm />
        <ValidateUserForm />
        <ListUserInfoForm />
        <AddUserToSubjectForm />
        <RemoveUserFromSubjectForm />
        <DeleteSubjectForm />
        <DeleteUserForm />
      </div>
    </div>
  )
}

export default Home
