import {
  cancelFinancialEvent,
  confirmFinancialEvent,
  createFinancialEvent,
  getFinancialEvent,
  listFinancialEvents,
  postponeFinancialEvent,
  realizeFinancialEvent,
  updateFinancialEvent,
  type CreateFinancialEventRequest,
  type FinancialEvent,
  type FinancialEventDetail,
  type ListFinancialEventsParams,
  type PostponeFinancialEventRequest,
  type RealizeFinancialEventResponse,
  type UpdateFinancialEventRequest,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

function responseData<T>(response: { status: number; data: unknown }, status: number): T {
  if (response.status !== status) throw new ApiError(response.status, response.data);
  return response.data as T;
}

export const listFinancialEventsData = async (params: ListFinancialEventsParams) => responseData<FinancialEvent[]>(await listFinancialEvents(params), 200);
export const getFinancialEventData = async (id: string) => responseData<FinancialEventDetail>(await getFinancialEvent(id), 200);
export const createFinancialEventData = async (request: CreateFinancialEventRequest) => responseData<FinancialEvent>(await createFinancialEvent(request), 201);
export const updateFinancialEventData = async (id: string, request: UpdateFinancialEventRequest) => responseData<FinancialEvent>(await updateFinancialEvent(id, request), 200);
export const cancelFinancialEventData = async (id: string) => responseData<FinancialEvent>(await cancelFinancialEvent(id), 200);
export const postponeFinancialEventData = async (id: string, request: PostponeFinancialEventRequest) => responseData<FinancialEvent>(await postponeFinancialEvent(id, request), 201);
export const confirmFinancialEventData = async (id: string) => responseData<FinancialEvent>(await confirmFinancialEvent(id), 201);
export const realizeFinancialEventData = async (id: string) => responseData<RealizeFinancialEventResponse>(await realizeFinancialEvent(id), 201);
