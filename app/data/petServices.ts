import { PetService, BookingAddon } from '../types/booking';

export const PET_SERVICES: PetService[] = [];

export const BOOKING_ADDONS: BookingAddon[] = [];

export const DEFAULT_TIME_SLOTS = [
  { time: '09:00 AM', period: 'morning' },
  { time: '10:30 AM', period: 'morning' },
  { time: '12:00 PM', period: 'afternoon' },
  { time: '01:30 PM', period: 'afternoon' },
  { time: '03:00 PM', period: 'afternoon' },
  { time: '04:30 PM', period: 'evening' },
  { time: '06:00 PM', period: 'evening' },
  { time: '07:30 PM', period: 'evening' }
] as const;
