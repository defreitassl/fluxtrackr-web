import {
  changePassword,
  getMe,
  updateMe,
  type ChangePasswordRequest,
  type Me,
  type PasswordUpdated,
  type UpdateMeRequest,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

function responseData<T>(response: { status: number; data: unknown }, status: number): T {
  if (response.status !== status) throw new ApiError(response.status, response.data);
  return response.data as T;
}

export const getMeData = async () => responseData<Me>(await getMe(), 200);
export const updateMeData = async (request: UpdateMeRequest) =>
  responseData<Me>(await updateMe(request), 200);
export const changePasswordData = async (request: ChangePasswordRequest) =>
  responseData<PasswordUpdated>(await changePassword(request), 200);
