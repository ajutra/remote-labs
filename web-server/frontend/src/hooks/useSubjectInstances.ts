import { useState } from 'react'

export interface SubjectInstance {
  id: string
  status: string
  userMail: string
  subjectName: string
  createdAt: string
  templateDescription?: string
  template_vcpu_count?: number
  template_vram_mb?: number
  template_size_mb?: number
}

export function useSubjectInstances(subjectId: string) {
  // Este hook ha sido eliminado. Usa useSubjectVMs en su lugar.
}
