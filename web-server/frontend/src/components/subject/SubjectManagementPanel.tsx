import React from 'react'
import { SubjectUsersManager } from './SubjectUsersManager'
import { SubjectInstancesManager } from './SubjectInstancesManager'
import { SubjectTemplatesManager } from './SubjectTemplatesManager'

interface SubjectManagementPanelProps {
  subjectId: string
}

export const SubjectManagementPanel: React.FC<SubjectManagementPanelProps> = ({
  subjectId,
}) => {
  return (
    <div className="space-y-8">
      <SubjectUsersManager subjectId={subjectId} />
      <SubjectInstancesManager subjectId={subjectId} />
      <SubjectTemplatesManager subjectId={subjectId} />
    </div>
  )
}
