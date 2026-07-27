import { useEffect, useRef } from "react";
import useMetricsStore from "#/stores/metrics-store";
import { useEventStore } from "#/stores/use-event-store";
import { isCondensationEvent } from "#/types/agent-server/type-guards";

/** How long to wait after a Condensation event for a lower per_turn_token. */
const METRICS_SETTLE_MS = 2_500;
/** Give up waiting for condensation / metrics and surface whatever we have. */
const DEFAULT_TIMEOUT_MS = 90_000;

export interface ContextCompactionResult {
  beforeToken: number;
  afterToken: number;
  savedToken: number;
}

export function buildContextCompactionResult(
  beforeToken: number,
  afterToken: number,
): ContextCompactionResult {
  return {
    beforeToken,
    afterToken,
    savedToken: Math.max(0, beforeToken - afterToken),
  };
}

interface UseAwaitContextCompactionOptions {
  /**
   * Snapshot of `per_turn_token` taken when compaction was requested.
   * Pass `null` when not awaiting a result.
   */
  beforeToken: number | null;
  onComplete: (result: ContextCompactionResult) => void;
  timeoutMs?: number;
}

/**
 * Waits for a post-request Condensation event (and ideally a lower
 * `per_turn_token` in the live metrics store), then reports how many tokens
 * were freed. The HTTP `/condense` ack only means work *started*.
 */
export function useAwaitContextCompaction({
  beforeToken,
  onComplete,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: UseAwaitContextCompactionOptions) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (beforeToken === null) {
      return undefined;
    }

    let completed = false;
    let sawCondensation = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const knownEventIds = new Set(useEventStore.getState().eventIds);

    const readAfterToken = () =>
      useMetricsStore.getState().usage?.per_turn_token ?? beforeToken;

    const finish = (afterToken: number) => {
      if (completed) {
        return;
      }
      completed = true;
      onCompleteRef.current(
        buildContextCompactionResult(beforeToken, afterToken),
      );
    };

    const finishFromMetricsIfReady = () => {
      const afterToken = readAfterToken();
      if (sawCondensation && afterToken < beforeToken) {
        finish(afterToken);
        return true;
      }
      return false;
    };

    const scheduleSettleFinish = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        finish(readAfterToken());
      }, METRICS_SETTLE_MS);
    };

    const scanForNewCondensation = () => {
      for (const event of useEventStore.getState().events) {
        const eventId = "id" in event ? event.id : undefined;
        if (eventId !== undefined) {
          if (knownEventIds.has(eventId)) {
            continue;
          }
          knownEventIds.add(eventId);
        }
        if (!isCondensationEvent(event)) {
          continue;
        }
        sawCondensation = true;
        if (!finishFromMetricsIfReady()) {
          scheduleSettleFinish();
        }
        return;
      }
    };

    scanForNewCondensation();

    const unsubscribeEvents = useEventStore.subscribe(() => {
      if (completed) {
        return;
      }
      scanForNewCondensation();
    });

    const unsubscribeMetrics = useMetricsStore.subscribe(() => {
      if (completed) {
        return;
      }
      if (finishFromMetricsIfReady()) {
        clearTimeout(settleTimer);
      }
    });

    const timeoutTimer = setTimeout(() => {
      finish(readAfterToken());
    }, timeoutMs);

    return () => {
      completed = true;
      unsubscribeEvents();
      unsubscribeMetrics();
      clearTimeout(settleTimer);
      clearTimeout(timeoutTimer);
    };
  }, [beforeToken, timeoutMs]);
}
