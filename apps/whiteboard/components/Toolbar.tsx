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
  TypeOutline,
} from "lucide-react";
import { IconButton } from "./IconButton";
import { Tool } from "@/util/type";

export function Toolbar({
  selectedTool,
  setSelectedTool,
  selectedColor,
  setSelectedColor
}: {
  selectedTool: Tool;
  setSelectedTool: (s: Tool) => void;
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
        title="Pointer"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("select");
        }}
        activated={selectedTool === "select"}
        icon={<SquareDashedMousePointer size={20} />}
        className="hidden sm:inline-block"
        title="Select"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("hand");
        }}
        activated={selectedTool === "hand"}
        icon={<Hand size={20} />}
        title="Grab"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("rect");
        }}
        activated={selectedTool === "rect"}
        icon={<Square size={20} />}
        title="Rectangle"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("rhombus");
        }}
        activated={selectedTool === "rhombus"}
        icon={<Diamond size={20} />}
        title="Rhombus"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("circle");
        }}
        activated={selectedTool === "circle"}
        icon={<Circle size={20} />}
        title="Circle"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("line");
        }}
        activated={selectedTool === "line"}
        icon={<Minus size={20} />}
        title="Line"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("arrow");
        }}
        activated={selectedTool === "arrow"}
        icon={<MoveRight size={20} />}
        title="Arrow"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("pencil");
        }}
        activated={selectedTool === "pencil"}
        icon={<Pencil size={20} />}
        title="Pencil"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("erase");
        }}
        activated={selectedTool === "erase"}
        icon={<Eraser size={20} />}
        title="Erase"
      />

      <IconButton
        onClick={() => {
          setSelectedTool("text");
        }}
        activated={selectedTool === "text"}
        icon={<TypeOutline size={20} />}
        className="hidden sm:inline-block"
        title="Text"
      />
    </div>
  );
}
