import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock child components so the test is focused on toggle logic
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <>{children}</>,
  useFileSystem: vi.fn().mockReturnValue({
    fileSystem: null,
    refreshTrigger: 0,
    selectedFile: null,
    setSelectedFile: vi.fn(),
    getAllFiles: vi.fn().mockReturnValue(new Map()),
  }),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <>{children}</>,
  useChat: vi.fn().mockReturnValue({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">PreviewFrame</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">HeaderActions</div>,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div data-testid="resize-handle" />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test("Preview tab is active by default", () => {
  render(<MainContent />);
  const previewTrigger = screen.getByRole("tab", { name: "Preview" });
  const codeTrigger = screen.getByRole("tab", { name: "Code" });
  expect(previewTrigger).toHaveAttribute("data-state", "active");
  expect(codeTrigger).toHaveAttribute("data-state", "inactive");
});

test("Clicking Code tab shows code editor and hides preview", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Preview frame should be visible initially
  expect(screen.getByTestId("preview-frame")).toBeInTheDocument();
  expect(screen.queryByTestId("code-editor")).not.toBeInTheDocument();

  // Click Code tab
  const codeTrigger = screen.getByRole("tab", { name: "Code" });
  await user.click(codeTrigger);

  // Code editor should now be visible
  expect(screen.getByTestId("code-editor")).toBeInTheDocument();
  expect(screen.queryByTestId("preview-frame")).not.toBeInTheDocument();
});

test("Clicking Preview tab shows preview and hides code editor", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Switch to Code view first
  const codeTrigger = screen.getByRole("tab", { name: "Code" });
  await user.click(codeTrigger);
  expect(screen.getByTestId("code-editor")).toBeInTheDocument();

  // Switch back to Preview
  const previewTrigger = screen.getByRole("tab", { name: "Preview" });
  await user.click(previewTrigger);

  // Preview frame should be visible again
  expect(screen.getByTestId("preview-frame")).toBeInTheDocument();
  expect(screen.queryByTestId("code-editor")).not.toBeInTheDocument();
});

test("Tab triggers update active state correctly", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const previewTrigger = screen.getByRole("tab", { name: "Preview" });
  const codeTrigger = screen.getByRole("tab", { name: "Code" });

  // Initially Preview is active
  expect(previewTrigger).toHaveAttribute("data-state", "active");
  expect(codeTrigger).toHaveAttribute("data-state", "inactive");

  // Click Code
  await user.click(codeTrigger);
  expect(codeTrigger).toHaveAttribute("data-state", "active");
  expect(previewTrigger).toHaveAttribute("data-state", "inactive");

  // Click Preview
  await user.click(previewTrigger);
  expect(previewTrigger).toHaveAttribute("data-state", "active");
  expect(codeTrigger).toHaveAttribute("data-state", "inactive");
});
