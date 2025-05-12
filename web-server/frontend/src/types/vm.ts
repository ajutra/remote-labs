export interface VMListItem {
  instanceId: string
  status: string
  userId: string
  subjectId: string
  templateId: string
  createdAt: string
  userMail: string
  subjectName: string
  templateDescription: string
  template_vcpu_count: number
  template_vram_mb: number
  template_size_mb: number
  template_os: string
}
