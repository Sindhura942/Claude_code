"use client";

import { Loader2 } from "lucide-react";

interface StrReplaceArgs {
  command: "view" | "create" | "str_replace" | "insert" | "undo_edit";
  path: string;
  new_path?: string;
}

interface FileManagerArgs {
  command: "rename" | "delete";
  path: string;
  new_path?: string;
}

type ToolArgs = StrReplaceArgs | FileManagerArgs | Record<string, unknown>;

interface ToolCallBadgeProps {
  toolName: string;
  args: ToolArgs;
  state: "call" | "partial-call" | "result";
}

function getLabel(toolName: string, args: ToolArgs): string {
  const path = (args as { path?: string }).path ?? "";
  const fileName = path.split("/").filter(Boolean).pop() ?? path;

  if (toolName === "str_replace_editor") {
    const { command } = args as StrReplaceArgs;
    switch (command) {
      case "create":
        return `Creating ${fileName}`;
      case "str_replace":
      case "insert":
        return `Editing ${fileName}`;
      case "view":
        return `Reading ${fileName}`;
      default:
        return `Updating ${fileName}`;
    }
  }

  if (toolName === "file_manager") {
    const { command, new_path } = args as FileManagerArgs;
    if (command === "rename") {
      const newFileName = new_path?.split("/").filter(Boolean).pop() ?? new_path ?? "";
      return `Renaming ${fileName} to ${newFileName}`;
    }
    if (command === "delete") {
      return `Deleting ${fileName}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolName, args, state }: ToolCallBadgeProps) {
  const label = getLabel(toolName, args);
  const done = state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
