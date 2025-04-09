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
import { useTranslation } from 'react-i18next'

function TestForms() {
  const { t } = useTranslation()
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">{t('Test Forms')}</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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

export default TestForms
