import axios from "axios";
import useTextStyleStore from "@/store/textStyleStore";

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
    };

export default async function initDraw(
  canvas: HTMLCanvasElement,
  roomId: string,
  socket: WebSocket,
  currentTool: string | null
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const existingShapes: Shape[] = await getExistingShapes(roomId);
  const { font, color, fontSize } = useTextStyleStore.getState();

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.MESSAGE_TYPE === "shape" && data.shape) {
      existingShapes.push(data.shape);
      clearCanvas(existingShapes, canvas, ctx);
    }
  };

  clearCanvas(existingShapes, canvas, ctx);

  let drawing = false;
  let startX = 0;
  let startY = 0;
  let tempShape: Shape | null = null;
  let pencilPoints: Point[] = [];
  let typing: boolean = false;

  // Keep track of the active tool when drawing starts
  // let activeTool: string | null = null;

  // Clean up any existing event listeners before adding new ones
  const mouseDownHandler = (e: MouseEvent) => {
    drawing = true;
    startX = e.clientX;
    startY = e.clientY;

    if (currentTool === "pencil") {
      pencilPoints = [{ x: startX, y: startY }];
    }

    if (currentTool === "text") {
      typing = true;
      const canvasRect = canvas.getBoundingClientRect();
      const canvasX = startX - canvasRect.left;
      const canvasY = startY - canvasRect.top;
      const input = document.createElement("input");

      if (typing) {
        input.type = "text";
        input.placeholder = "Enter text...";
        input.style.position = "absolute";
        input.style.top = `${startX}px`;
        input.style.left = `${startX}px`;
        input.style.zIndex = "1000";
        input.style.padding = "4px";
        // input.style.border = "1px solid black";
        input.style.background = "#fff";
        document.body.appendChild(input);

        input.focus();
      }

      const handleInputBlur = () => {
        typing = false;
        const content = input.value.trim();
        if (content) {
          const shape: Shape = {
            type: "text",
            x: canvasX,
            y: canvasY,
            content,
            font,
            fontSize,
            color,
          };

          existingShapes.push(shape);
          clearCanvas(existingShapes, canvas, ctx);

          socket.send(
            JSON.stringify({
              MESSAGE_TYPE: "shape",
              shape,
              roomId,
            })
          );
        }
        document.body.removeChild(input);
        window.removeEventListener("click", handleClickOutside);
      };

      const handleClickOutside = (e: MouseEvent) => {
        if (!input.contains(e.target as Node)) {
          handleInputBlur();
        }
      };

      window.addEventListener("click", handleClickOutside);
      input.addEventListener("blur", handleInputBlur);

      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          handleInputBlur();
        }
      });
    }
  };

  const mouseMoveHandler = (e: MouseEvent) => {
    if (!drawing) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    // Clear and redraw existing shapes
    clearCanvas(existingShapes, canvas, ctx);

    // Use the activeTool that was captured when drawing started
    switch (currentTool) {
      case "rect": {
        const width = currentX - startX;
        const height = currentY - startY;
        ctx.strokeRect(startX, startY, width, height);
        tempShape = { type: "rect", x: startX, y: startY, width, height };
        break;
      }
      case "circle": {
        // Support oval shapes like Excalidraw
        const radiusX = Math.abs(currentX - startX);
        const radiusY = Math.abs(currentY - startY);

        ctx.beginPath();
        ctx.ellipse(startX, startY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();

        tempShape = {
          type: "circle",
          centerX: startX,
          centerY: startY,
          radiusX,
          radiusY,
        };
        break;
      }
      case "rhombus": {
        const width = currentX - startX;
        const height = currentY - startY;
        const centerX = startX + width / 2;
        const centerY = startY + height / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, startY); // top
        ctx.lineTo(currentX, centerY); // right
        ctx.lineTo(centerX, currentY); // bottom
        ctx.lineTo(startX, centerY); // left
        ctx.closePath();
        ctx.stroke();
        tempShape = { type: "rhombus", x: startX, y: startY, width, height };
        break;
      }
      case "line": {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        tempShape = {
          type: "line",
          x1: startX,
          y1: startY,
          x2: currentX,
          y2: currentY,
        };
        break;
      }
      case "arrow": {
        drawArrow(ctx, startX, startY, currentX, currentY);
        tempShape = {
          type: "arrow",
          x1: startX,
          y1: startY,
          x2: currentX,
          y2: currentY,
        };
        break;
      }
      case "pencil": {
        pencilPoints.push({ x: currentX, y: currentY });
        ctx.beginPath();
        ctx.moveTo(pencilPoints[0].x, pencilPoints[0].y);
        pencilPoints.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
        tempShape = { type: "pencil", points: [...pencilPoints] };
        break;
      }
      // text case is handled in moveDown handler
      default:
        break;
    }
  };

  const mouseUpHandler = () => {
    if (!drawing) return;

    drawing = false;
    if (tempShape) {
      existingShapes.push(tempShape);
      clearCanvas(existingShapes, canvas, ctx);
      socket.send(
        JSON.stringify({
          MESSAGE_TYPE: "shape",
          shape: tempShape,
          roomId,
        })
      );
      tempShape = null;
    }
    // Reset the active tool reference
    currentTool = null;
  };

  // Remove any existing event listeners and add new ones
  canvas.removeEventListener("mousedown", mouseDownHandler);
  canvas.removeEventListener("mousemove", mouseMoveHandler);
  canvas.removeEventListener("mouseup", mouseUpHandler);

  canvas.addEventListener("mousedown", mouseDownHandler);
  canvas.addEventListener("mousemove", mouseMoveHandler);
  canvas.addEventListener("mouseup", mouseUpHandler);

  // Return a cleanup function to properly remove event listeners
  return () => {
    canvas.removeEventListener("mousedown", mouseDownHandler);
    canvas.removeEventListener("mousemove", mouseMoveHandler);
    canvas.removeEventListener("mouseup", mouseUpHandler);
  };
}

// Helper function to draw an arrow
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const headLength = 10;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  // Draw the line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Draw the arrow head
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

function clearCanvas(
  shapes: Shape[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  shapes.forEach((shape) => {
    switch (shape.type) {
      case "rect":
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        break;
      case "circle":
        ctx.beginPath();
        // Handle both old and new circle formats
        if ("radiusX" in shape && "radiusY" in shape) {
          // Handle new oval/ellipse format
          ctx.ellipse(
            shape.centerX,
            shape.centerY,
            shape.radiusX,
            shape.radiusY,
            0,
            0,
            2 * Math.PI
          );
        }
        ctx.stroke();
        break;
      case "rhombus": {
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, shape.y);
        ctx.lineTo(shape.x + shape.width, centerY);
        ctx.lineTo(centerX, shape.y + shape.height);
        ctx.lineTo(shape.x, centerY);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case "line":
        ctx.beginPath();
        ctx.moveTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x2, shape.y2);
        ctx.stroke();
        break;
      case "arrow":
        drawArrow(ctx, shape.x1, shape.y1, shape.x2, shape.y2);
        break;
      case "pencil":
        if (shape.points && shape.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          shape.points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
          ctx.stroke();
        }
        break;
      case "text":
        ctx.fillText(shape.content, shape.x, shape.y);
        break;
      default:
        break;
    }
  });
}

async function getExistingShapes(roomId: string) {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_HTTP_BACKEND}/shapes/${roomId}`
  );
  const shapes = res.data.shapes;
  return shapes;
}
