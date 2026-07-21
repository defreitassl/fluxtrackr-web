import { z } from "zod";

export const payCreditCardInvoiceFormSchema = z.object({
  accountId: z.string().min(1, { error: "Selecione a conta que fará o pagamento." }),
  paidAt: z.string().refine((value) => value === "" || !Number.isNaN(new Date(value).getTime()), {
    error: "Informe uma data e hora válidas ou deixe o campo vazio.",
  }),
});

export type PayCreditCardInvoiceFormValues = z.infer<typeof payCreditCardInvoiceFormSchema>;
