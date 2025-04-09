import { Subject } from './subject'

export interface VMListItem {
  id: string
  name: string
  status: 'running' | 'stopped' | 'paused'
  subject: Subject
  ipAddress: string
  os: string
  lastStarted: string
}
