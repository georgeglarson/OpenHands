import { beforeEach, describe, expect, it } from "vitest";
import {
  MOVED_CONVERSATIONS_STORAGE_KEY,
  useMovedConversationsStore,
} from "#/stores/moved-conversations-store";

const BACKEND_ID = "default-local";

describe("moved-conversations store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useMovedConversationsStore.setState({ movesByBackendId: {} });
  });

  it("records a move target for a conversation", () => {
    useMovedConversationsStore
      .getState()
      .moveConversation(BACKEND_ID, "conversation-a", "/home/user/projects");

    expect(
      useMovedConversationsStore.getState().movesByBackendId[BACKEND_ID],
    ).toEqual({ "conversation-a": "/home/user/projects" });
  });

  it("overwrites an existing move target", () => {
    const store = useMovedConversationsStore.getState();
    store.moveConversation(BACKEND_ID, "conversation-a", "/home/user/projects");
    store.moveConversation(BACKEND_ID, "conversation-a", "/home/user/trash");

    expect(
      useMovedConversationsStore.getState().movesByBackendId[BACKEND_ID],
    ).toEqual({ "conversation-a": "/home/user/trash" });
  });

  it("clears a move target, restoring the original grouping", () => {
    const store = useMovedConversationsStore.getState();
    store.moveConversation(BACKEND_ID, "conversation-a", "/home/user/projects");
    store.clearMove(BACKEND_ID, "conversation-a");

    expect(
      useMovedConversationsStore.getState().movesByBackendId[BACKEND_ID],
    ).toEqual({});
  });

  it("keeps backends isolated", () => {
    const store = useMovedConversationsStore.getState();
    store.moveConversation(BACKEND_ID, "conversation-a", "/home/user/projects");
    store.moveConversation("other-backend", "conversation-a", "/tmp/elsewhere");
    store.clearMove("other-backend", "conversation-a");

    expect(
      useMovedConversationsStore.getState().movesByBackendId[BACKEND_ID],
    ).toEqual({ "conversation-a": "/home/user/projects" });
  });

  it("persists moves so they survive reloads and pagination", () => {
    useMovedConversationsStore
      .getState()
      .moveConversation(BACKEND_ID, "conversation-a", "/home/user/projects");

    const persisted = JSON.parse(
      window.localStorage.getItem(MOVED_CONVERSATIONS_STORAGE_KEY) ?? "{}",
    );
    expect(persisted.state.movesByBackendId[BACKEND_ID]).toEqual({
      "conversation-a": "/home/user/projects",
    });
  });
});
