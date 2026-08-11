import { useState } from "react";

export function useAsyncAction<Args extends unknown[]>(
  action: (...args: Args) => Promise<void>
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (...args: Args) => {
    setPending(true);
    setError(null);
    try {
      await action(...args);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  };

  return { run, pending, error, setError };
}
