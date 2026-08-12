import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BaseModalDescription,
  BaseModalTitle,
} from "#/components/shared/modals/confirmation-modals/base-modal";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { BrandButton } from "../settings/brand-button";
import { I18nKey } from "#/i18n/declaration";
import { useLocalWorkspaces } from "#/hooks/query/use-local-workspaces";
import { cn } from "#/utils/utils";

interface MoveConversationModalProps {
  /** Workspace path the conversation is currently grouped under (override-aware). */
  currentWorkspace: string | null;
  /** True when a move override is applied, enabling "Original workspace". */
  hasOverride: boolean;
  /** Called with the chosen workspace path, or `null` to restore the original. */
  onConfirm: (workspacePath: string | null) => void;
  onCancel: () => void;
}

export function MoveConversationModal({
  currentWorkspace,
  hasOverride,
  onConfirm,
  onCancel,
}: MoveConversationModalProps) {
  const { t } = useTranslation("openhands");
  const { data } = useLocalWorkspaces();
  const workspaces = data?.workspaces ?? [];
  // `undefined` = nothing chosen yet; `null` = "Original workspace".
  const [selected, setSelected] = useState<string | null | undefined>(
    undefined,
  );

  const rowClassName = (isSelected: boolean, disabled: boolean) =>
    cn(
      "w-full rounded-md border px-3 py-2 text-left text-sm",
      isSelected
        ? "border-[var(--oh-accent)] bg-[var(--oh-surface)]"
        : "border-[var(--oh-border)]",
      disabled && "opacity-50 cursor-not-allowed",
    );

  return (
    <ModalBackdrop onClose={onCancel}>
      <ModalBody className="items-start border border-[var(--oh-border)]">
        <div className="flex flex-col gap-2">
          <BaseModalTitle title={t(I18nKey.COMMON$MOVE_CONVERSATION)} />
          <BaseModalDescription>
            {t(I18nKey.CONVERSATION$MOVE_DESCRIPTION)}
          </BaseModalDescription>
        </div>
        <div className="flex w-full flex-col gap-1 max-h-64 overflow-y-auto">
          {hasOverride && (
            <button
              type="button"
              data-testid="move-target-original"
              className={rowClassName(selected === null, false)}
              onClick={() => setSelected(null)}
            >
              {t(I18nKey.CONVERSATION$MOVE_ORIGINAL_WORKSPACE)}
            </button>
          )}
          {workspaces.map((workspace) => {
            const isCurrent = workspace.path === currentWorkspace;
            return (
              <button
                key={workspace.id}
                type="button"
                data-testid={`move-target-${workspace.path}`}
                disabled={isCurrent}
                className={rowClassName(selected === workspace.path, isCurrent)}
                onClick={() => setSelected(workspace.path)}
              >
                <span className="block truncate font-medium">
                  {workspace.name}
                </span>
                <span className="block truncate text-xs text-[var(--oh-text-secondary)]">
                  {workspace.path}
                </span>
              </button>
            );
          })}
          {workspaces.length === 0 && !hasOverride && (
            <BaseModalDescription>
              {t(I18nKey.HOME$NO_WORKSPACES)}
            </BaseModalDescription>
          )}
        </div>
        <div
          className="flex justify-end gap-2 w-full"
          onClick={(event) => event.stopPropagation()}
        >
          <BrandButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            testId="cancel-button"
          >
            {t(I18nKey.BUTTON$CANCEL)}
          </BrandButton>
          <BrandButton
            type="button"
            variant="primary"
            isDisabled={selected === undefined}
            onClick={() => {
              if (selected !== undefined) onConfirm(selected);
            }}
            testId="confirm-button"
          >
            {t(I18nKey.BUTTON$MOVE)}
          </BrandButton>
        </div>
      </ModalBody>
    </ModalBackdrop>
  );
}
