import {
  dismissNotification,
  getNotificationPreferences,
  listActivities,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
  type ActivityPage,
  type DismissedResponse,
  type ListActivitiesParams,
  type ListNotificationsParams,
  type Notification,
  type NotificationPage,
  type NotificationPreferences,
  type UpdatedCount,
  type UpdateNotificationPreferencesRequest,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

function responseData<T>(response: { status: number; data: unknown }, status: number): T {
  if (response.status !== status) throw new ApiError(response.status, response.data);
  return response.data as T;
}

export const listNotificationsData = async (params?: ListNotificationsParams) =>
  responseData<NotificationPage>(await listNotifications(params), 200);
export const listActivitiesData = async (params?: ListActivitiesParams) =>
  responseData<ActivityPage>(await listActivities(params), 200);
export const markNotificationReadData = async (id: string) =>
  responseData<Notification>(await markNotificationRead(id), 200);
export const markAllNotificationsReadData = async () =>
  responseData<UpdatedCount>(await markAllNotificationsRead(), 201);
export const dismissNotificationData = async (id: string) =>
  responseData<DismissedResponse>(await dismissNotification(id), 200);
export const getNotificationPreferencesData = async () =>
  responseData<NotificationPreferences>(await getNotificationPreferences(), 200);
export const updateNotificationPreferencesData = async (request: UpdateNotificationPreferencesRequest) =>
  responseData<NotificationPreferences>(await updateNotificationPreferences(request), 200);
