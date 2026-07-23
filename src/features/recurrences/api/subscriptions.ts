import {
  archiveSubscription,
  cancelSubscriptionCharge,
  createSubscription,
  getSubscriptionsSummary,
  listSubscriptionCharges,
  listSubscriptions,
  realizeSubscriptionCharge,
  updateSubscription,
  type ArchivedResponse,
  type CreateSubscriptionRequest,
  type GetSubscriptionsSummaryParams,
  type ListSubscriptionChargesParams,
  type ListSubscriptionsParams,
  type RealizeSubscriptionChargeRequest,
  type RealizeSubscriptionChargeResponse,
  type Subscription,
  type SubscriptionCharge,
  type SubscriptionsSummary,
  type UpdateSubscriptionRequest,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

function responseData<T>(response: { status: number; data: unknown }, status: number): T {
  if (response.status !== status) throw new ApiError(response.status, response.data);
  return response.data as T;
}

export const listSubscriptionsData = async (params: ListSubscriptionsParams = {}) =>
  responseData<Subscription[]>(await listSubscriptions(params), 200);

export const getSubscriptionsSummaryData = async (params: GetSubscriptionsSummaryParams = {}) =>
  responseData<SubscriptionsSummary>(await getSubscriptionsSummary(params), 200);

export const createSubscriptionData = async (request: CreateSubscriptionRequest) =>
  responseData<Subscription>(await createSubscription(request), 201);

export const updateSubscriptionData = async (id: string, request: UpdateSubscriptionRequest) =>
  responseData<Subscription>(await updateSubscription(id, request), 200);

export const archiveSubscriptionData = async (id: string) =>
  responseData<ArchivedResponse>(await archiveSubscription(id), 200);

export const listSubscriptionChargesData = async (params: ListSubscriptionChargesParams = {}) =>
  responseData<SubscriptionCharge[]>(await listSubscriptionCharges(params), 200);

export const realizeSubscriptionChargeData = async (
  id: string,
  request: RealizeSubscriptionChargeRequest,
) => responseData<RealizeSubscriptionChargeResponse>(await realizeSubscriptionCharge(id, request), 201);

export const cancelSubscriptionChargeData = async (id: string) =>
  responseData<SubscriptionCharge>(await cancelSubscriptionCharge(id), 201);
