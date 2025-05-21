import CreateProfessorForm from '@/components/forms/CreateProfessorForm'
import CreateSubjectForm from '@/components/forms/CreateSubjectForm'
import CreateUserForm from '@/components/forms/CreateUserForm'
import ListAllSubjectsByUserForm from '@/components/forms/ListAllSubjectsByUserForm'
import ListAllUsersOfSubjectForm from '@/components/forms/ListAllUsersOfSubjectForm'
import ListUserInfoForm from '@/components/forms/ListUsersInfoForm'
import ValidateUserForm from '@/components/forms/ValidateUserForm'
import AddUserToSubjectForm from '@/components/forms/AddUserToSubjectForm'
import DeleteSubjectForm from '@/components/forms/DeleteSubjectForm'
import DeleteUserForm from '@/components/forms/DeleteUserForm'
import RemoveUserFromSubjectForm from '@/components/forms/RemoveUserFromSubjectFrom'
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
