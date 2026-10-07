// A screen's figures: asked for when the screen comes to the front, and again when it is pulled down.
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { message } from "./api";

export function useLoad<T>(ask: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const asked = useRef(0);

  const load = useCallback(async (pulled = false) => {
    const turn = ++asked.current;
    if (pulled) setRefreshing(true);
    try {
      const found = await ask();
      if (turn !== asked.current) return;
      setData(found);
      setError(null);
    } catch (e) {
      if (turn === asked.current) setError(message(e, "This screen failed to load."));
    } finally {
      if (turn === asked.current) setRefreshing(false);
    }
  }, [ask]);

  useFocusEffect(useCallback(() => void load(), [load]));

  return { data, error, refreshing, refresh: () => load(true) };
}
