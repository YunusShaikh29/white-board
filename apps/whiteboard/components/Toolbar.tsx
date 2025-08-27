import {
  Circle,
  Diamond,
  Eraser,
  Hand,
  Minus,
  MousePointer2,
  MoveRight,
  Pencil,
  Square,
  SquareDashedMousePointer,
  Trash2,
  TypeOutline,
} from "lucide-react";
import { IconButton } from "./IconButton";
import { Tool } from "@/util/type";

export function Toolbar({
  selectedTool,
  setSelectedTool,
  onClearCanvas,
}: {
  selectedTool: Tool;
  setSelectedTool: (s: Tool) => void;
  onClearCanvas?: () => void;
}) {
  return (
    <div className="fixed top-10 left-[50%] -translate-x-[50%] flex gap-4 items-center justify-center shadow-lg bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-90 rounded-lg px-4 py-2 text-xs font-mono">
      <IconButton
        onClick={() => {
          setSelectedTool("point");
        }}
        activated={selectedTool === "point"}
        icon={<MousePointer2 size={20} />}
        className="hidden sm:inline-block"
        title="Pointer (1)"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("select");
        }}
        activated={selectedTool === "select"}
        icon={<SquareDashedMousePointer size={20} />}
        className="hidden sm:inline-block"
        title="Select (S)"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("hand");
        }}
        activated={selectedTool === "hand"}
        icon={<Hand size={20} />}
        title="Grab (H)"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("rect");
        }}
        activated={selectedTool === "rect"}
        icon={<Square size={20} />}
        title="Rectangle (R)"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("rhombus");
        }}
        activated={selectedTool === "rhombus"}
        icon={<Diamond size={20} />}
        title="Rhombus (D)"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("circle");
        }}
        activated={selectedTool === "circle"}
        icon={<Circle size={20} />}
        title="Circle (C)"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("line");
        }}
        activated={selectedTool === "line"}
        icon={<Minus size={20} />}
        title="Line (L)"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("arrow");
        }}
        activated={selectedTool === "arrow"}
        icon={<MoveRight size={20} />}
        title="Arrow (A)"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("pencil");
        }}
        activated={selectedTool === "pencil"}
        icon={<Pencil size={20} />}
        title="Pencil (P)"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("erase");
        }}
        activated={selectedTool === "erase"}
        icon={<Eraser size={20} />}
        title="Erase (E)"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("text");
        }}
        activated={selectedTool === "text"}
        icon={<TypeOutline size={20} />}
        className="hidden sm:inline-block"
        title="Text (T)"
      />

      {/* Separator */}
      <div className="w-px h-6 bg-gray-300 mx-2" />

      <IconButton
        onClick={onClearCanvas || (() => {})}
        activated={false}
        icon={<Trash2 size={20} />}
        title="Clear Canvas"
        className="text-red-500 hover:text-red-600"
      />
    </div>
  );
}
