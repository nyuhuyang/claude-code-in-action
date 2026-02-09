import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallDisplay } from "../ToolCallDisplay";

vi.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className}>
      Loader2
    </div>
  ),
  FileEdit: ({ className }: { className?: string }) => (
    <div data-testid="file-edit-icon" className={className}>
      FileEdit
    </div>
  ),
  FilePlus: ({ className }: { className?: string }) => (
    <div data-testid="file-plus-icon" className={className}>
      FilePlus
    </div>
  ),
  Eye: ({ className }: { className?: string }) => (
    <div data-testid="eye-icon" className={className}>
      Eye
    </div>
  ),
}));

afterEach(() => {
  cleanup();
});

test("displays creating message for create command", () => {
  const mockToolInvocation = {
    toolCallId: "test-1",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/App.jsx",
      file_text: "const App = () => <div>Hello</div>;",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(screen.getByTestId("loader-icon")).toBeDefined();
  expect(screen.getByTestId("file-plus-icon")).toBeDefined();
});

test("displays editing message for str_replace command", () => {
  const mockToolInvocation = {
    toolCallId: "test-2",
    toolName: "str_replace_editor",
    args: {
      command: "str_replace",
      path: "/components/Card.jsx",
      old_str: "old",
      new_str: "new",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
  expect(screen.getByTestId("file-edit-icon")).toBeDefined();
});

test("displays editing message for insert command", () => {
  const mockToolInvocation = {
    toolCallId: "test-3",
    toolName: "str_replace_editor",
    args: {
      command: "insert",
      path: "/utils/helper.js",
      insert_line: 10,
      new_str: "console.log('test');",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("Editing helper.js")).toBeDefined();
  expect(screen.getByTestId("file-edit-icon")).toBeDefined();
});

test("displays viewing message for view command", () => {
  const mockToolInvocation = {
    toolCallId: "test-4",
    toolName: "str_replace_editor",
    args: {
      command: "view",
      path: "/App.jsx",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("Viewing App.jsx")).toBeDefined();
  expect(screen.getByTestId("eye-icon")).toBeDefined();
});

test("shows loading spinner when state is call", () => {
  const mockToolInvocation = {
    toolCallId: "test-5",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/App.jsx",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByTestId("loader-icon")).toBeDefined();
  const greenDot = document.querySelector(".bg-emerald-500");
  expect(greenDot).toBeNull();
});

test("shows green dot when state is result with result", () => {
  const mockToolInvocation = {
    toolCallId: "test-6",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/App.jsx",
    },
    state: "result" as const,
    result: { success: true },
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  const greenDot = document.querySelector(".bg-emerald-500");
  expect(greenDot).toBeDefined();
  expect(screen.queryByTestId("loader-icon")).toBeNull();
});

test("shows loading spinner when state is partial-call", () => {
  const mockToolInvocation = {
    toolCallId: "test-7",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/App.jsx",
    },
    state: "partial-call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByTestId("loader-icon")).toBeDefined();
});

test("extracts filename from full path", () => {
  const mockToolInvocation = {
    toolCallId: "test-8",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/App.jsx",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("extracts filename from nested path", () => {
  const mockToolInvocation = {
    toolCallId: "test-9",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/components/ui/Card.jsx",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
});

test("handles missing path gracefully", () => {
  const mockToolInvocation = {
    toolCallId: "test-10",
    toolName: "str_replace_editor",
    args: {
      command: "create",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("Creating file")).toBeDefined();
});

test("handles empty path gracefully", () => {
  const mockToolInvocation = {
    toolCallId: "test-11",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("Creating file")).toBeDefined();
});

test("handles file_manager delete command", () => {
  const mockToolInvocation = {
    toolCallId: "test-12",
    toolName: "file_manager",
    args: {
      command: "delete",
      path: "/old-file.js",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("Deleting old-file.js")).toBeDefined();
  expect(screen.getByTestId("file-edit-icon")).toBeDefined();
});

test("handles file_manager rename command", () => {
  const mockToolInvocation = {
    toolCallId: "test-13",
    toolName: "file_manager",
    args: {
      command: "rename",
      path: "/old-name.js",
      new_path: "/new-name.js",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("Renaming old-name.js")).toBeDefined();
  expect(screen.getByTestId("file-edit-icon")).toBeDefined();
});

test("falls back to sanitized display for unknown tool", () => {
  const mockToolInvocation = {
    toolCallId: "test-14",
    toolName: "unknown_tool_name",
    args: {},
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("unknown tool name")).toBeDefined();
});

test("handles missing args", () => {
  const mockToolInvocation = {
    toolCallId: "test-15",
    toolName: "str_replace_editor",
    args: undefined as any,
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("str replace editor")).toBeDefined();
});

test("shows loading when state is result but no result provided", () => {
  const mockToolInvocation = {
    toolCallId: "test-16",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/App.jsx",
    },
    state: "result" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByTestId("loader-icon")).toBeDefined();
  const greenDot = document.querySelector(".bg-emerald-500");
  expect(greenDot).toBeNull();
});

test("handles undo_edit command", () => {
  const mockToolInvocation = {
    toolCallId: "test-17",
    toolName: "str_replace_editor",
    args: {
      command: "undo_edit",
      path: "/App.jsx",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("Modifying App.jsx")).toBeDefined();
  expect(screen.getByTestId("file-edit-icon")).toBeDefined();
});

test("handles path with only slashes", () => {
  const mockToolInvocation = {
    toolCallId: "test-18",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/",
    },
    state: "call" as const,
  };

  render(<ToolCallDisplay toolInvocation={mockToolInvocation} />);
  expect(screen.getByText("Creating file")).toBeDefined();
});
