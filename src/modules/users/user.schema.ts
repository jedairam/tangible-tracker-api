import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.string().email('El email no es válido'),
});

export const updateUserSchema = z
  .object({
    firstName: z.string().min(1, 'El nombre no puede estar vacío'),
    lastName: z.string().min(1, 'El apellido no puede estar vacío'),
    email: z.string().email('El email no es válido'),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo',
  });

export const userIdParamSchema = z.object({
  id: z.string().min(1, 'El id del usuario es obligatorio'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
