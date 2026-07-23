import { useQuery } from "@tanstack/react-query";

import { getUnreadNotificationsCount, type UnreadCount } from "@/api/generated/client";
import { ApiError } from "@/lib/http";

export function useUnreadNotificationsCount() {
  return useQuery<UnreadCount, ApiError>({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const response = await getUnreadNotificationsCount();
      if (response.status !== 200) {
        throw new ApiError(response.status, response.data);
      }
      return response.data;
    },
    retry: false,
  });
}
