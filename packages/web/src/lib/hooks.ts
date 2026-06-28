import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { PlayResponse, GuessResult, DailyChallengeResponse, Venue } from "./types";

export function usePlayClassic() {
  return useMutation<PlayResponse, Error>({
    mutationFn: () => api("/play/classic", { method: "POST" }),
  });
}

export function useSubmitGuess() {
  return useMutation<
    GuessResult,
    Error,
    { photo_id: string; guessed_venue_id: string; time_ms: number }
  >({
    mutationFn: (body) =>
      api("/guesses", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useDailyChallenge() {
  return useQuery<DailyChallengeResponse, Error>({
    queryKey: ["daily-challenge"],
    queryFn: () => api("/daily-challenge"),
  });
}

export function useDailyChallengeGuess() {
  return useMutation<
    GuessResult,
    Error,
    { photo_id: string; guessed_venue_id: string; time_ms: number }
  >({
    mutationFn: (body) =>
      api("/daily-challenge/guesses", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useVenueSearch(query: string) {
  return useQuery<Venue[], Error>({
    queryKey: ["venues", query],
    queryFn: async () => {
      const res = await api<{ data: Venue[] }>(
        `/venues/search?q=${encodeURIComponent(query)}`,
      );
      return res.data;
    },
    enabled: query.length >= 2,
  });
}

export function useUploadPhoto() {
  return useMutation<
    unknown,
    Error,
    {
      photo: File;
      category: string;
      venue_id?: string;
      venue?: Record<string, unknown>;
      client_censored?: boolean;
    }
  >({
    mutationFn: (body) => {
      const formData = new FormData();
      formData.append("photo", body.photo);
      formData.append("category", body.category);
      if (body.venue_id) formData.append("venue_id", body.venue_id);
      if (body.venue) formData.append("venue", JSON.stringify(body.venue));
      if (body.client_censored !== undefined)
        formData.append("client_censored", String(body.client_censored));
      return api("/photos", { method: "POST", body: formData });
    },
  });
}
