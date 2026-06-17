import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reusable hook returning the currently-signed-in Supabase user.
 * Cached by TanStack Query so multiple callers share a single request.
 *
 * Returns `null` when the user is signed out, `undefined` while loading.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
    staleTime: 60_000,
  });
}
