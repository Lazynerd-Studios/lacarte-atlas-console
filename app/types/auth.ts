// Auth & User Type Definitions

/** Role can be a simple string or an object with a name property */
export interface AuthRole {
  id?: string
  name: string
  description?: string
  permissions?: string[]
  color?: string
  isSystem?: boolean
}

/** Better Auth base user shape (from /auth/sign-in/email) */
export interface AuthUser {
  id: string
  name: string
  email: string
  emailVerified?: boolean
  image?: string | null
  createdAt: string
  updatedAt: string
  twoFactorEnabled?: boolean
  banned?: boolean
  banReason?: string | null
  banExpires?: string | null
  /** Augmented after profile fetch — can be string or AuthRole object */
  role?: string | AuthRole
  /** Augmented after profile fetch */
  permissions?: string[]
}

/** Team member profile returned by /user/profile (data.admin) */
export interface AuthTeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role?: AuthRole
  permissions?: string[]
  status?: 'active' | 'inactive'
  lastLogin?: string
  createdAt?: string
  updatedAt?: string
}

/** Sign-in response from /auth/sign-in/email */
export interface SignInResponse {
  token: string
  user: AuthUser
}

/** Session check response from /auth/get-session */
export interface SessionResponse {
  user: AuthUser
}

/** Profile response from /user/profile */
export interface ProfileResponse {
  data: {
    admin: AuthTeamMember
  }
}
