import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { householdApi } from "@/features/household/api";
import { useNavigate } from "react-router-dom";
import { showToast } from "@/lib/toast";
import axios, { type AxiosError } from "axios";

export const useHousehold = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: household,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["household", "me"],
    queryFn: householdApi.getMyHousehold,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: false, // Don't retry if 404 (user has no household)
  });

  const createHouseholdMutation = useMutation({
    mutationFn: householdApi.create,
    onSuccess: (data) => {
      queryClient.setQueryData(["household", "me"], data);
      showToast.success("Household created! 🏠", `Welcome to ${data.name}!`);
    },
    onError: () => {
      showToast.error("Failed to create household", "Please try again.");
    },
  });

  const joinHouseholdMutation = useMutation({
    mutationFn: householdApi.join,
    onSuccess: (data) => {
      queryClient.setQueryData(["household", "me"], data);
      showToast.success(
        "Joined household! 🎉",
        `You are now a member of ${data.name}.`
      );
    },
    onError: () => {
      showToast.error(
        "Failed to join household",
        "Please check the invite code and try again."
      );
    },
  });

  const leaveHouseholdMutation = useMutation({
    mutationFn: householdApi.leave,
    onSuccess: () => {
      queryClient.setQueryData(["household", "me"], null);
      queryClient.invalidateQueries({ queryKey: ["chores"] });
      queryClient.invalidateQueries({ queryKey: ["needs"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      showToast.success(
        "Left household",
        "You have successfully left the household."
      );
      navigate("/household");
    },
    onError: (error: unknown) => {
      let message = "Please try again.";
      if (axios.isAxiosError(error)) {
        const respData = (error as AxiosError<{ message?: string }>).response
          ?.data;
        if (respData?.message) {
          message = respData.message;
        }
      }
      showToast.error("Failed to leave household", message);
    },
  });

  const updateHouseholdMutation = useMutation({
    mutationFn: householdApi.update,
    onSuccess: (data) => {
      queryClient.setQueryData(["household", "me"], data);
      showToast.success("Household updated", `Changes saved successfully.`);
    },
    onError: () => {
      showToast.error("Failed to update", "Please try again.");
    },
  });

  return {
    household,
    isLoading,
    error,
    createHousehold: createHouseholdMutation.mutate,
    isCreating: createHouseholdMutation.isPending,
    joinHousehold: joinHouseholdMutation.mutate,
    isJoining: joinHouseholdMutation.isPending,
    leaveHousehold: leaveHouseholdMutation.mutate,
    isLeaving: leaveHouseholdMutation.isPending,
    updateHousehold: updateHouseholdMutation.mutate,
    isUpdating: updateHouseholdMutation.isPending,
  };
};
