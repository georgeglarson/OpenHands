import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const MOVED_CONVERSATIONS_STORAGE_KEY = "moved-conversations";

interface MovedConversationsState {
  /**
   * backendId → (conversationId → workspace path the conversation is grouped
   * under). This is a display-organization override only: the conversation's
   * `selected_workspace` keeps recording where the agent actually ran, and
   * clearing the override restores that original grouping.
   */
  movesByBackendId: Record<string, Record<string, string>>;
}

interface MovedConversationsActions {
  moveConversation: (
    backendId: string,
    conversationId: string,
    workspacePath: string,
  ) => void;
  clearMove: (backendId: string, conversationId: string) => void;
}

type MovedConversationsStore = MovedConversationsState &
  MovedConversationsActions;

const initialState: MovedConversationsState = {
  movesByBackendId: {},
};

export const useMovedConversationsStore = create<MovedConversationsStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      moveConversation: (backendId, conversationId, workspacePath) => {
        const current = get().movesByBackendId[backendId] ?? {};
        set({
          movesByBackendId: {
            ...get().movesByBackendId,
            [backendId]: { ...current, [conversationId]: workspacePath },
          },
        });
      },

      clearMove: (backendId, conversationId) => {
        const current = get().movesByBackendId[backendId];
        if (!current || !(conversationId in current)) return;
        const { [conversationId]: _removed, ...rest } = current;
        set({
          movesByBackendId: {
            ...get().movesByBackendId,
            [backendId]: rest,
          },
        });
      },
    }),
    {
      name: MOVED_CONVERSATIONS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): MovedConversationsState => ({
        movesByBackendId: state.movesByBackendId,
      }),
    },
  ),
);
