import { z } from 'zod';

export const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .trim()
      .min(1, { message: t('validation.email.required') })
      .email({ message: t('validation.email.invalid') }),
    password: z
      .string()
      .min(8, { message: t('validation.password.length') }),
  });

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;

export const createSignupSchema = (t: (key: string) => string) =>
  z
    .object({
      email: z
        .string()
        .trim()
        .min(1, { message: t('validation.email.required') })
        .email({ message: t('validation.email.invalid') }),
      password: z
        .string()
        .min(8, { message: t('validation.password.length') }),
      confirmPassword: z
        .string()
        .min(8, { message: t('validation.password.length') }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: t('validation.confirmPassword.mismatch'),
    });

export type SignupInput = z.infer<ReturnType<typeof createSignupSchema>>;
