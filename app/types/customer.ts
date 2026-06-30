// Customer type definitions

/** User account attached to a customer (Better Auth shape) */
export interface CustomerUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  role: string
  banned: boolean
  banReason?: string | null
  twoFactorEnabled?: boolean
  createdAt: string
  updatedAt: string
}

/** Customer type returned by /customer/admin/{id} */
export interface CustomerType {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

/** Zone assigned to a customer */
export interface CustomerZone {
  id: string
  name: string
  color: string
  isActive: boolean
}

/** Customer returned by GET /customer/admin/{id} */
export interface Customer {
  id: string
  userId: string
  customerTypeId: string
  zoneId: string
  phoneNumber: string
  noBins: number
  status: string
  address: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  country: string | null
  placeName: string | null
  locationUpdatedAt: string | null
  location: { latitude: number; longitude: number } | null
  createdAt: string
  updatedAt: string
  user: CustomerUser
  customerType: CustomerType | null
  zone: CustomerZone | null
}
