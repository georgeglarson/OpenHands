import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MoveConversationModal } from "#/components/features/conversation-panel/move-conversation-modal";

vi.mock("#/hooks/query/use-local-workspaces", () => ({
  useLocalWorkspaces: () => ({
    data: {
      workspaces: [
        { id: "1", name: "projects", path: "/home/u/projects" },
        { id: "2", name: "trash", path: "/home/u/trash" },
      ],
    },
  }),
}));

describe("MoveConversationModal", () => {
  it("lists registered workspaces and confirms the selected one", async () => {
    const onConfirm = vi.fn();
    render(
      <MoveConversationModal
        currentWorkspace="/home/u/projects"
        hasOverride={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByTestId("move-target-/home/u/trash"));
    await userEvent.click(screen.getByTestId("confirm-button"));
    expect(onConfirm).toHaveBeenCalledWith("/home/u/trash");
  });

  it("disables confirm until a different target is chosen", () => {
    render(
      <MoveConversationModal
        currentWorkspace="/home/u/projects"
        hasOverride={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId("confirm-button")).toBeDisabled();
  });

  it("disables the row for the current workspace", () => {
    render(
      <MoveConversationModal
        currentWorkspace="/home/u/projects"
        hasOverride={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId("move-target-/home/u/projects")).toBeDisabled();
  });

  it("offers Original workspace only when an override exists", async () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <MoveConversationModal
        currentWorkspace="/home/u/trash"
        hasOverride
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByTestId("move-target-original"));
    await userEvent.click(screen.getByTestId("confirm-button"));
    expect(onConfirm).toHaveBeenCalledWith(null);

    rerender(
      <MoveConversationModal
        currentWorkspace="/home/u/trash"
        hasOverride={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("move-target-original")).toBeNull();
  });
});
