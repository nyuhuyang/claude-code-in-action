import { Loader2, FileEdit, FilePlus, Eye } from "lucide-react";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  state: "call" | "result" | "partial-call";
  result?: any;
}

interface ToolCallDisplayProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallDisplay({ toolInvocation }: ToolCallDisplayProps) {
  const { toolName, args, state, result } = toolInvocation;

  const getToolMessage = (): { icon: React.ReactNode; message: string } => {
    if (toolName === "str_replace_editor" && args) {
      const { command, path } = args;
      const fileName = path ? (path.split("/").filter(Boolean).pop() || "file") : "file";

      switch (command) {
        case "create":
          return {
            icon: <FilePlus className="w-3.5 h-3.5 text-neutral-600" />,
            message: `Creating ${fileName}`,
          };
        case "str_replace":
          return {
            icon: <FileEdit className="w-3.5 h-3.5 text-neutral-600" />,
            message: `Editing ${fileName}`,
          };
        case "insert":
          return {
            icon: <FileEdit className="w-3.5 h-3.5 text-neutral-600" />,
            message: `Editing ${fileName}`,
          };
        case "view":
          return {
            icon: <Eye className="w-3.5 h-3.5 text-neutral-600" />,
            message: `Viewing ${fileName}`,
          };
        default:
          return {
            icon: <FileEdit className="w-3.5 h-3.5 text-neutral-600" />,
            message: `Modifying ${fileName}`,
          };
      }
    }

    if (toolName === "file_manager" && args) {
      const { command, path } = args;
      const fileName = path ? (path.split("/").filter(Boolean).pop() || "file") : "file";

      switch (command) {
        case "delete":
          return {
            icon: <FileEdit className="w-3.5 h-3.5 text-neutral-600" />,
            message: `Deleting ${fileName}`,
          };
        case "rename":
          return {
            icon: <FileEdit className="w-3.5 h-3.5 text-neutral-600" />,
            message: `Renaming ${fileName}`,
          };
        default:
          return {
            icon: <FileEdit className="w-3.5 h-3.5 text-neutral-600" />,
            message: `Managing ${fileName}`,
          };
      }
    }

    return {
      icon: <FileEdit className="w-3.5 h-3.5 text-neutral-600" />,
      message: toolName.replace(/_/g, " "),
    };
  };

  const { icon, message } = getToolMessage();
  const isComplete = state === "result" && result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          {icon}
          <span className="text-neutral-700">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          {icon}
          <span className="text-neutral-700">{message}</span>
        </>
      )}
    </div>
  );
}
