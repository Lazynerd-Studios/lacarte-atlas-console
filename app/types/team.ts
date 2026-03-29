// Team Management Data Models

export interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  roleDetails?: {
    id: string
    name: string
    color: string
  }
  status: 'active' | 'inactive'
  permissions: string[]
  lastLogin: string
  createdAt: string
  updatedAt?: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  color?: string
  isSystem: boolean
  createdAt: string
  updatedAt?: string
}

export interface Permission {
  id: string
  label: string
  description: string
  module: string
}

export interface CreateTeamMemberPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  status: 'active' | 'inactive'
}

export interface UpdateTeamMemberPayload {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: string
  status?: 'active' | 'inactive'
  permissions?: string[]
}

export interface CreateRolePayload {
  name: string
  description: string
  permissions: string[]
}
