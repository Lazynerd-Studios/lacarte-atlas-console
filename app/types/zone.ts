// Zone type definitions

export type PickupDay =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export type PickupFrequency = 'weekly' | 'biweekly' | 'monthly'

export type PickupTimeSlot = 'morning' | 'afternoon' | 'evening'

/**
 * Optional automatic pickup schedule attached to a zone.
 * All fields nullable — null means unset. Auto-generation of pickups only
 * happens when the schedule is complete (see isZoneScheduleComplete).
 */
export interface ZoneScheduleFields {
  pickupDay: PickupDay | null
  pickupFrequency: PickupFrequency | null
  pickupTimeSlot: PickupTimeSlot | null
  /** 1–4, only meaningful when pickupFrequency is 'monthly' */
  weekOfMonth: number | null
  /** Must reference an active disposable item type */
  defaultItemTypeId: string | null
  /** Must reference an active estimated quantity */
  defaultEstimatedQuantityId: string | null
}

/** Zone returned by /zone/admin endpoints */
export interface Zone extends ZoneScheduleFields {
  id: string
  name: string
  description: string
  color: string
  areas: string[]
  driverCount: number
  customerCount: number
  isActive: boolean
}

/** Payload emitted by the add/edit zone modals */
export interface ZoneFormPayload {
  name: string
  description: string
  color: string
  areas: string[]
  isActive: boolean
  pickupDay: PickupDay | null
  pickupFrequency: PickupFrequency | null
  pickupTimeSlot: PickupTimeSlot | null
  weekOfMonth: number | null
  defaultItemTypeId: string | null
  defaultEstimatedQuantityId: string | null
}

/**
 * A zone schedule is complete when every field needed for generation is set.
 * weekOfMonth is only required for monthly frequency (sending it with any
 * other frequency is a 400).
 */
export function isZoneScheduleComplete(zone: ZoneScheduleFields): boolean {
  return (
    zone.pickupDay != null &&
    zone.pickupFrequency != null &&
    zone.pickupTimeSlot != null &&
    (zone.pickupFrequency !== 'monthly' || zone.weekOfMonth != null) &&
    zone.defaultItemTypeId != null &&
    zone.defaultEstimatedQuantityId != null
  )
}

/** True when at least one schedule field is set (partial schedule) */
export function hasPartialSchedule(zone: ZoneScheduleFields): boolean {
  return (
    zone.pickupDay != null ||
    zone.pickupFrequency != null ||
    zone.pickupTimeSlot != null ||
    zone.weekOfMonth != null ||
    zone.defaultItemTypeId != null ||
    zone.defaultEstimatedQuantityId != null
  )
}
