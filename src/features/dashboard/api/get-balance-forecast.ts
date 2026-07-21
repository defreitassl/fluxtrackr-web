import {
  getBalanceForecast,
  listCreditCards,
  type BalanceForecast,
  type CreditCard,
  type GetBalanceForecastParams,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

function responseData<T>(response: { status: number; data: unknown }, status: number): T {
  if (response.status !== status) throw new ApiError(response.status, response.data);
  return response.data as T;
}

export const getBalanceForecastData = async (params?: GetBalanceForecastParams) =>
  responseData<BalanceForecast>(await getBalanceForecast(params), 200);

export const listDashboardCreditCardsData = async () =>
  responseData<CreditCard[]>(await listCreditCards(), 200);
