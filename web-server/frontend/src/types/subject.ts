export interface Subject {
  id: string
  name: string
  code: string
  professorName: string
  professorMail: string
}

export interface VM {
  id: string
  name: string
  status: 'running' | 'stopped' | 'paused'
  subjectId: string
  ipAddress: string
  os: string
  cpu: string
  memory: string
  disk: string
  lastStarted: string
  wireguardConfig: string
}
