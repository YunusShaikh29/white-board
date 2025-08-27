export type Tool =
  | "circle"
  | "rect"
  | "pencil"
  | "clear"
  | "erase"
  | "undo"
  | "redo"
  | "hand"
  | "point"
  | "text"
  | "select"
  | "line"
  | "arrow"
  | "rhombus"
  | null;

export type Point = { x: number; y: number };

export type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radiusX: number; // Changed to support oval shapes
      radiusY: number; // Added to support oval shapes
    }
  | {
      type: "rhombus"; // diamond shape
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }
  | {
      type: "arrow";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }
  | {
      type: "pencil";
      points: Point[];
    }
  | {
      type: "text";
      x: number;
      y: number;
      content: string;
      font: string;
      fontSize: number;
      color: string;
    }
  | null;

export type Theme = "rgb(24,24,27)" | "rgb(255,255,255)";

export type Color =
  | "#000000"
  | "#7a7a7a"
  | "#ffa6a6"
  | "#a6ffa6"
  | "#a6a6ff"
  | "#ffffa6"
  | "#ffa6ff"
  | "#a6ffff"
  | "#ffffff";

export type StrokeWidth = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10;

export const colors: Color[] = [
  "#000000",
  "#7a7a7a", // Black
  "#ffa6a6", // Red
  "#a6ffa6", // Green
  "#a6a6ff", // Blue
  "#ffffa6", // Yellow
  "#ffa6ff", // Magenta
  "#a6ffff", // Cyan
  "#ffffff", // White
];
