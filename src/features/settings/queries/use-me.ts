"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Me, UpdateMeRequest } from "@/api/generated/client";
import { changePasswordData, getMeData, updateMeData } from "@/features/settings/api/me";
import { ApiError } from "@/lib/http";

export function useMe() {
  return useQuery<Me, ApiError>({
    queryKey: ["me"],
    queryFn: getMeData,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation<Me, ApiError, UpdateMeRequest>({
    mutationFn: updateMeData,
    onSuccess: (me) => {
      queryClient.setQueryData(["me"], me);
    },
  });
}

export function useChangePassword() {
  return useMutation<{ updated: true }, ApiError, Parameters<typeof changePasswordData>[0]>({
    mutationFn: changePasswordData,
  });
}
