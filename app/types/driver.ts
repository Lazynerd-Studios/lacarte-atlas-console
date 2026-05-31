// Driver & Fleet Type Definitions

export interface Zone {
  id: string
  name: string
  color?: string
}

export interface DriverUser {
  name?: string
  email?: string
}

export interface AssignedTruck {
  truckId: string
  plateNumber: string
}

export interface Driver {
  id: string
  name?: string
  email?: string
  phoneNumber?: string
  user?: DriverUser
  licenseNumber?: string
  licenseExpiry?: string
  zone?: Zone
  zoneId?: string
  status: 'active' | 'inactive' | 'on_leave' | 'on-route' | 'online'
  assignedTruck?: AssignedTruck | null
  assignedPickups?: number
  totalTrips?: number
  earnings?: number
  incomplete?: number
  deductionAmt?: number
  completed?: number
  total?: number
}

export interface CreateDriverPayload {
  email: string
  name: string
  phoneNumber: string
  licenseNumber?: string
  licenseExpiry?: string
  zoneId?: string
  status?: string
}

export interface UpdateDriverPayload {
  email?: string
  name?: string
  phoneNumber?: string
  licenseNumber?: string
  licenseExpiry?: string
  zoneId?: string
  status?: string
}

export interface TruckDriver {
  id: string
  name?: string
}

export interface Truck {
  id: string
  truckId: string
  plateNumber: string
  vinNumber?: string
  make?: string
  model?: string
  year?: number
  capacity?: string
  status: 'active' | 'maintenance' | 'inactive'
  assignedDriver?: TruckDriver | null
  lastGpsUpdate?: string
  gpsDeviceId?: string
  registrationExpiry?: string
  notes?: string
}

export interface CreateTruckPayload {
  truckId: string
  plateNumber: string
  vinNumber: string
  make: string
  model: string
  year: number
  capacity: string
  status: string
  gpsDeviceId?: string
  registrationExpiry: string
  notes?: string
}
