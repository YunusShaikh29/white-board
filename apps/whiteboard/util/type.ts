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
