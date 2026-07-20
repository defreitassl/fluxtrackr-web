import {
  getFinancialTimeline,
  type FinancialTimeline,
  type GetFinancialTimelineParams,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** Mantém o envelope HTTP do Orval fora da camada de interface. */
export async function getFinancialTimelineData(
  params: GetFinancialTimelineParams,
): Promise<FinancialTimeline> {
  const response = await getFinancialTimeline(params);

  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
