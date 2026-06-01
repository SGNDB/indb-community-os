import {z} from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const registerSchema = z
  .object({
    username: z.string().min(3).max(24),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export const createPostSchema = z.object({
  title: z.string().min(4).max(120),
  content: z.string().min(8).max(2800),
  categoryId: z.coerce.number().int().positive(),
});

export const commentSchema = z.object({
  content: z.string().min(2).max(1200),
});

export const profileSchema = z.object({
  username: z.string().min(3).max(24),
  fullName: z.string().min(2).max(100),
  bio: z.string().max(500).optional().or(z.literal("")),
  avatarUrl: z.url().optional().or(z.literal("")),
});

export const memorySchema = z.object({
  title: z.string().min(4).max(150),
  story: z.string().min(10).max(5000),
  categoryId: z.coerce.number().int().positive(),
  eraLabel: z.string().max(60).optional().or(z.literal("")),
  location: z.string().max(120).optional().or(z.literal("")),
});

export const ideaSchema = z.object({
  title: z.string().min(4).max(150),
  description: z.string().min(10).max(5000),
  categoryId: z.coerce.number().int().positive(),
});


