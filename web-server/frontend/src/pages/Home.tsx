import CreateProfessorForm from '@/components/CreateProfessorForm'
import CreateSubjectForm from '@/components/CreateSubjectForm'
import CreateUserForm from '@/components/CreateUserForm'
import ListAllSubjectsByUserForm from '@/components/ListAllSubjectsByUserForm'
import ListAllUsersOfSubjectForm from '@/components/ListAllUsersOfSubjectForm'
import ListUserInfoForm from '@/components/ListUsersInfoForm'
import ValidateUserForm from '@/components/ValidateUserForm'
import AddUserToSubjectForm from '@/components/AddUserToSubjectForm'
import DeleteSubjectForm from '@/components/DeleteSubjectForm'
import DeleteUserForm from '@/components/DeleteUserForm'
import RemoveUserFromSubjectForm from '@/components/RemoveUserFromSubjectFrom'
import LanguageSelector from '@/components/LanguageSelector'
import '@/i18n'

function Home() {
  return (
    <div className="mt-8 flex min-h-screen flex-row items-start gap-2">
      <LanguageSelector />
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
  )
}

export default Home
