import {
  getDashboardOverview,
  type DashboardOverview,
  type GetDashboardOverviewParams,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** Mantém envelopes HTTP do Orval fora da camada de interface. */
export async function getDashboardOverviewData(
  params?: GetDashboardOverviewParams,
): Promise<DashboardOverview> {
  const response = await getDashboardOverview(params);

  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
