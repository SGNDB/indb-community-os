"use client";

import {Trash2} from "lucide-react";

import {Button} from "@/components/ui/button";

interface DeleteUserSubmitButtonProps {
  confirmLabel: string;
  disabled?: boolean;
  label: string;
}

export function DeleteUserSubmitButton({
  confirmLabel,
  disabled = false,
  label,
}: DeleteUserSubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="destructive"
      size="sm"
      disabled={disabled}
      className="min-h-11 rounded-2xl"
      onClick={(event) => {
        if (!window.confirm(confirmLabel)) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 size={15} />
      {label}
    </Button>
  );
}
