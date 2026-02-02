import { z } from 'zod';

export const TableInputSchema = z.object({
  name: z.string().trim().min(1, 'Nazwa stolika jest wymagana').max(100, 'Nazwa zbyt długa'),
  seats: z.number().int().min(1, 'Minimum 1 miejsce').max(20, 'Maksimum 20 miejsc'),
  notes: z.string().trim().max(500, 'Notatki zbyt długie').optional().or(z.literal('')).default(''),
});

export type TableInput = z.infer<typeof TableInputSchema>;
