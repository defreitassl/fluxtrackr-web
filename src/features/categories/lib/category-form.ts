import { z } from "zod";

import { CategoryType, type Category, type CreateCategoryRequest, type UpdateCategoryRequest } from "@/api/generated/client";
import { ApiError } from "@/lib/http";

const categoryTypeValues = Object.values(CategoryType) as [CategoryType, ...CategoryType[]];

export const categoryFormSchema = z.object({
  name: z.string().refine((value) => value.trim().length > 0, { error: "Informe o nome da categoria." }),
  type: z.enum(categoryTypeValues, { error: "Selecione um tipo." }),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const categoryTypeOptions: Array<{ value: CategoryType; label: string }> = [
  { value: "income", label: "Receita" },
  { value: "expense", label: "Despesa" },
  { value: "both", label: "Receita e despesa" },
];

export function categoryTypeLabel(type: CategoryType) {
  return categoryTypeOptions.find((option) => option.value === type)?.label ?? type;
}

export function toCreateCategoryPayload(values: CategoryFormValues): CreateCategoryRequest {
  return { name: values.name.trim(), type: values.type };
}

export function toUpdateCategoryPayload(values: CategoryFormValues): UpdateCategoryRequest {
  return { name: values.name.trim(), type: values.type };
}

export function toCategoryFormValues(category: Category): CategoryFormValues {
  return { name: category.name, type: category.type };
}

export function getCategoryErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) return "Verifique os dados da categoria e tente novamente.";
    if (error.status === 404) return "A categoria não foi encontrada. Atualize a lista e tente novamente.";
    if (error.status === 409) return "Já existe uma categoria com esse nome ou há um orçamento ativo incompatível.";
    if (error.status === 503) return "Serviço indisponível. Tente novamente.";
  }
  return "Não foi possível salvar a categoria.";
}
