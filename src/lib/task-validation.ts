import { z } from 'zod';

export const TaskInputSchema = z.object({
  title: z.string().trim().min(1, 'Tytuł jest wymagany').max(140, 'Tytuł zbyt długi'),
  description: z.string().trim().max(500, 'Opis zbyt długi').optional().or(z.literal('')),
  category: z.string().trim().min(1).max(50),
  isPriority: z.boolean().default(false),
});

export type TaskInput = z.infer<typeof TaskInputSchema>;

export const ExpenseInputSchema = z.object({
  title: z.string().trim().min(1, 'Tytuł jest wymagany').max(140, 'Tytuł zbyt długi'),
  category: z.string().trim().min(1).max(50),
  amount: z.number().nonnegative('Kwota nie może być ujemna').max(9999999, 'Kwota zbyt duża'),
  isDeposit: z.boolean().default(false),
  paymentStatus: z.enum(['none', 'paid']).default('none'),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

export type ExpenseInput = z.infer<typeof ExpenseInputSchema>;
