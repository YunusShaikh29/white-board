import { create } from "zustand";

interface ToolState {
  currentTool: string | null;
  setCurrentTool: (tool: string) => void;
}

const useToolStore = create<ToolState>((set) => ({
  currentTool: null,
  setCurrentTool: (tool) => set({ currentTool: tool }),
}));

export default useToolStore;
