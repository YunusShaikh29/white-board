"use client";

import clsx from "clsx";
import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Diamond,
  ArrowRight,
  Minus,
  Pencil,
  Text,
} from "lucide-react";
// import { useCallback } from "react";
import useToolStore from "@/store/toolStore";
import useTextStyleStore from "@/store/textStyleStore";

const tools = [
  { id: "mouse", icon: MousePointer2, label: "Selection" },
  { id: "hand", icon: Hand, label: "Hand(Panning)" },
  { id: "rect", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "rhombus", icon: Diamond, label: "Rhombus" },
  { id: "arrow", icon: ArrowRight, label: "Arrow" },
  { id: "line", icon: Minus, label: "Line" },
  { id: "pencil", icon: Pencil, label: "Pencil" },
  { id: "text", icon: Text, label: "Text" },
];

export function Tool() {
  //   const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const { currentTool, setCurrentTool } = useToolStore();
  const { color, font, fontSize, setColor, setFont, setFontSize } =
    useTextStyleStore();

  const handleShapesClicked = (tool: string) => {
    setCurrentTool(tool);
    console.log(currentTool);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex items-center">
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-md z-20">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleShapesClicked(tool.id)}
            className={clsx(
              "p-2 rounded-md transition-colors",
              currentTool === tool.id
                ? "bg-rose-300 shadow-sm"
                : "hover:bg-white/50"
            )}
            title={tool.label}
          >
            <tool.icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      {currentTool === "text" && (
        <div className="ml-2 flex items-center gap-2">
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="bg-white border rounded p-1"
          >
             <option value="Arial">Arial</option>
            <option value="Verdana">Verdana</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="bg-white border rounded p-1 w-16"
            min="1"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-6 w-6 border rounded"
          />
        </div>
      )}
    </div>
  );
}
