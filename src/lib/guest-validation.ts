import { z } from 'zod'

export const GuestInputSchema = z.object({
  firstName: z.string().trim().min(1, 'Imię jest wymagane').max(60, 'Imię zbyt długie'),
  lastName: z.string().trim().max(60, 'Nazwisko zbyt długie').optional().nullable(),
  email: z.string()
    .trim()
    .max(254, 'Email zbyt długi')
    .email('Nieprawidłowy format email')
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().max(20, 'Telefon zbyt długi').optional().or(z.literal('')),
  group: z.string().min(1, 'Grupa jest wymagana').max(50, 'Nazwa grupy zbyt długa'),
  status: z.enum(['adult', 'child']).default('adult'),
  isChild: z.boolean().default(false),
  childAge: z.number().int().min(0).max(17).optional(),
  rsvpStatus: z.enum(['sent', 'confirmed', 'declined', 'pending']).default('pending'),
  accommodation: z.boolean().default(false),
  transport: z.boolean().default(false),
  dietaryRestrictions: z.string().trim().max(1000, 'Ograniczenia żywieniowe zbyt długie').optional().or(z.literal('')),
  notes: z.string().trim().max(1000, 'Notatki zbyt długie').optional().or(z.literal('')),
  isServiceProvider: z.boolean().default(false),
  discountType: z.enum(['none', 'discount', 'free']).default('none'),
  companionOfGuestId: z.string().uuid('Nieprawidłowe ID gościa').optional().nullable(),
});

export type GuestInput = z.infer<typeof GuestInputSchema>;

// Legacy schema for backward compatibility
export const GuestSchema = z.object({
  fullName: z.string().min(2, 'Imię i nazwisko jest wymagane'),
  guest_group: z.string().optional().default('family'),
  status: z.enum(['adult', 'child']).default('adult'),
  childAge: z.number().optional(),
  rsvp_status: z.enum(['sent', 'confirmed', 'declined', 'pending']).default('pending'),
  email: z.string()
    .optional()
    .refine(
      (val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      { message: 'Nieprawidłowy format email' }
    ),
  phone: z.string().optional().or(z.literal('')),
  accommodation: z.boolean().optional().default(false),
  transport: z.boolean().optional().default(false),
  isCompanion: z.boolean().optional().default(false),
  hasDietaryRestrictions: z.boolean().optional().default(false),
  hasDiscount: z.boolean().optional().default(false),
  isServiceProvider: z.boolean().optional().default(false),
  notes: z.string().optional().or(z.literal(''))
});