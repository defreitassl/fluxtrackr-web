import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome.").max(120, "Use no máximo 120 caracteres."),
  email: z.email("Informe um e-mail válido.").trim(),
  password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres.").max(128, "Use no máximo 128 caracteres."),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
