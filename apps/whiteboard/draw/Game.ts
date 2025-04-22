import { getExistingShapes } from "./http";
import { Shape, Point, Tool, Color, Theme } from "@/util/type";
export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[];
  private roomId: number;
  private socket: WebSocket;
  private drawing: boolean;
  private startX: number = 0;
  private startY: number = 0;
  private selectedShape: Tool = "rect";
  private selecteColor: Color = "#000000";
  private theme: Theme = "rgb(24,24,27)";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tempShape: any;
  private _selectedShape: Tool | null;
  private hasInput: boolean = false;
  private pencilPoints: Point[];

  constructor(canvas: HTMLCanvasElement, roomId: number, socket: WebSocket) {
    // ...existing code...
    // Set up eraser cursor when tool is erase
    Object.defineProperty(this, 'selectedShape', {
      set: (tool: Tool) => {
        this._selectedShape = tool;
        if (tool === 'erase' || tool === "line" || tool === "arrow") {
          this.canvas.style.cursor = 'crosshair';
        } else {
          this.canvas.style.cursor = 'default';
        }
      },
      get: () => this._selectedShape,
      configurable: true
    });
    this._selectedShape = null;

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    this.drawing = false;
    this.selectedShape = null;
    this.tempShape = {};
    this.pencilPoints = [];
    this.init();
    this.initHandler();
    this.clearCanvas();
    this.initMouseHandlers();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
  }

  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.clearCanvas();
  }

  initHandler() {
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.MESSAGE_TYPE === "shape" && data.shape) {
        this.existingShapes.push(data.shape);
        this.clearCanvas();
      }
      if (data.MESSAGE_TYPE === "erase" && data.shapeIds) {
        this.existingShapes = this.existingShapes.filter(
          shape => !data.shapeIds.includes(shape?.id || -1)
        );
        this.clearCanvas();
      }
    };
  }

  setTool(tool: Tool) {
    this.selectedShape = tool;
  }

  eraseAt(x: number, y: number) {
    const eraserRadius = 20;
    const erasedShapeIds: number[] = [];
    this.existingShapes = this.existingShapes.filter(shape => {
      const hit = this.shapeIntersectsEraser(shape, x, y, eraserRadius);
      if (hit && shape?.id) {
        erasedShapeIds.push(shape.id);
      }
      return !hit;
    });
  
    if (erasedShapeIds.length > 0) {
      this.clearCanvas();
      this.socket.send(
        JSON.stringify({
          MESSAGE_TYPE: "erase",
          shapeIds: erasedShapeIds,
          roomId: this.roomId,
        })
      );
    }
  }

  shapeIntersectsEraser(shape: any, x: number, y: number, radius: number) {
    // Rect
    if (shape.type === "rect") {
      return (
        x + radius > shape.x &&
        x - radius < shape.x + shape.width &&
        y + radius > shape.y &&
        y - radius < shape.y + shape.height
      );
    }
    // Circle
    if (shape.type === "circle") {
      const dx = x - shape.centerX;
      const dy = y - shape.centerY;
      return Math.sqrt(dx * dx + dy * dy) < (shape.radiusX || shape.radius) + radius;
    }
    // Line/Arrow
    if (shape.type === "line" || shape.type === "arrow") {
      const dist = this.pointToSegmentDistance(x, y, shape.x1, shape.y1, shape.x2, shape.y2);
      return dist < radius;
    }
    // Pencil
    if (shape.type === "pencil" && Array.isArray(shape.points)) {
      return shape.points.some(pt => Math.hypot(pt.x - x, pt.y - y) < radius);
    }
    // Text
    if (shape.type === "text") {
      return (
        x + radius > shape.x &&
        x - radius < shape.x + (shape.width || 50) &&
        y + radius > shape.y - (shape.fontSize || 16) &&
        y - radius < shape.y
      );
    }
    return false;
  }

  pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  setColor(color: Color) {
    // Adjust color based on theme
    if (
      this.theme === "rgb(24,24,27)" &&
      (color === "#000000" || color === "#7a7a7a")
    ) {
      this.selecteColor = "#ffffff";
    } else if (this.theme === "rgb(255,255,255)" && color === "#ffffff") {
      this.selecteColor = "#000000";
    } else {
      this.selecteColor = color;
    }

    this.ctx.strokeStyle = this.selecteColor;
  }

  setTheme(theme: Theme) {
    this.theme = theme;

    // Adjust current color based on new theme
    if (
      theme === "rgb(24,24,27)" &&
      (this.selecteColor === "#000000" || this.selecteColor === "#7a7a7a")
    ) {
      this.selecteColor = "#ffffff";
    } else if (
      theme === "rgb(255,255,255)" &&
      this.selecteColor === "#ffffff"
    ) {
      this.selecteColor = "#000000";
    }

    this.ctx.strokeStyle = this.selecteColor;
    this.clearCanvas();
  }

  drawText(shape: Shape) {
    if (shape?.type === "text") {
      this.ctx.font = "14px Arial";
      // Set text color based on theme
      this.ctx.fillStyle =
        this.theme === "rgb(24,24,27)" ? "#ffffff" : "#000000";
      this.ctx.fillText(shape.content, shape.x, shape.y);
    }
  }

  drawRect(shape: Shape) {
    if (shape?.type === "rect") {
      this.ctx.strokeStyle = this.selecteColor;
      this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
  }

  drawCircle(shape: Shape) {
    if (shape?.type === "circle") {
      this.ctx.strokeStyle = this.selecteColor.toString();
      this.ctx.beginPath();
      // Handle both old and new circle formats
      if ("radiusX" in shape && "radiusY" in shape) {
        // Handle new oval/ellipse format
        this.ctx.ellipse(
          shape.centerX,
          shape.centerY,
          shape.radiusX,
          shape.radiusY,
          0,
          0,
          2 * Math.PI
        );
      }
      this.ctx.stroke();
    }
  }

  drawRhombus(shape: Shape) {
    if (shape?.type === "rhombus") {
      this.ctx.strokeStyle = this.selecteColor.toString();
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, shape.y);
      this.ctx.lineTo(shape.x + shape.width, centerY);
      this.ctx.lineTo(centerX, shape.y + shape.height);
      this.ctx.lineTo(shape.x, centerY);
      this.ctx.closePath();
      this.ctx.stroke();
    }
  }

  drawLine(shape: Shape) {
    if (shape?.type === "line") {
      this.ctx.strokeStyle = this.selecteColor.toString();
      this.ctx.beginPath();
      this.ctx.moveTo(shape.x1, shape.y1);
      this.ctx.lineTo(shape.x2, shape.y2);
      this.ctx.stroke();
    }
  }

  drawArrow(shape: Shape) {
    if (shape?.type === "arrow") {
      this.ctx.strokeStyle = this.selecteColor.toString();
      const headLength = 10;
      const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);

      // Draw the line
      this.ctx.beginPath();
      this.ctx.moveTo(shape.x1, shape.y1);
      this.ctx.lineTo(shape.x2, shape.y2);
      this.ctx.stroke();
      // to the arrow head
      this.ctx.beginPath();
      this.ctx.moveTo(shape.x2, shape.y2);
      this.ctx.lineTo(
        shape.x2 - headLength * Math.cos(angle - Math.PI / 6),
        shape.y2 - headLength * Math.sin(angle - Math.PI / 6)
      );
      this.ctx.moveTo(shape.x2, shape.y2);
      this.ctx.lineTo(
        shape.x2 - headLength * Math.cos(angle + Math.PI / 6),
        shape.y2 - headLength * Math.sin(angle + Math.PI / 6)
      );
      this.ctx.stroke();
    }
  }

  drawPencil(shape: Shape) {
    if (shape?.type === "pencil") {
      if (shape.points && shape.points.length > 0) {
        this.ctx.strokeStyle = this.selecteColor.toString();
        this.ctx.beginPath();
        this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
        shape.points.forEach((pt) => this.ctx.lineTo(pt.x, pt.y));
        this.ctx.stroke();
      }
    }
  }

  // drawText(shape: Shape) {
  //   if (shape?.type === "text") {
  //     this.ctx.font = "14px Arial"; // Customize font as needed
  //     this.ctx.fillStyle = this.theme.toString();
  //     this.ctx.strokeStyle = this.selecteColor.toString();
  //     this.ctx.fillText(shape.content, shape.x, shape.y);
  //   }
  // }

  clearCanvas() {
    this.ctx.fillStyle = this.theme;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.existingShapes.forEach((shape) => {
      if (!shape) return;

      this.ctx.strokeStyle =
        this.theme === "rgb(24,24,27)" ? "#ffffff" : "#000000";

      switch (shape.type) {
        case "rect":
          this.drawRect(shape);
          break;
        case "circle":
          this.drawCircle(shape);
          break;
        case "rhombus":
          this.drawRhombus(shape);
          break;
        case "line":
          this.drawLine(shape);
          break;
        case "arrow":
          this.drawArrow(shape);
          break;
        case "pencil":
          this.drawPencil(shape);
          break;
        case "text":
          this.drawText(shape);
          break;
        default:
          break;
      }
    });
  }

  mouseDownHandler = (e: MouseEvent) => {
    if (this.selectedShape === "erase") {
      this.drawing = true;
      this.eraseAt(e.offsetX, e.offsetY);
      return;
    }
    console.log("control reached here, mouse_DOWN");
    this.drawing = true;
    this.startX = e.clientX;
    this.startY = e.clientY;

    if (this.selectedShape === "pencil") {
      this.pencilPoints = [{ x: this.startX, y: this.startY }];
      this.existingShapes.push({ type: "pencil", points: this.pencilPoints });
    }

    if (this.selectedShape === "text") {
      const canvasRect = this.canvas.getBoundingClientRect();
      const canvasX = e.clientX - canvasRect.left;
      const canvasY = e.clientY - canvasRect.top;
      if (this.hasInput) return;

      this.hasInput = true;

      const input = document.createElement("input");

      input.type = "text";
      input.style.position = "absolute";
      input.style.top = `${canvasY}px`;
      input.style.left = `${canvasX}px`;
      input.style.fontSize = "14px";
      input.style.zIndex = "1000";
      input.style.padding = "1em";
      input.style.fontSize = "1rem";

      document.body.appendChild(input);

      input.focus();

      input.addEventListener("blur", () => {
        console.log(input.value);
        const content = input.value;

        if (content.trim().length !== 0 || content.trim() !== "") {
          this.tempShape = {
            type: "text",
            x: canvasX,
            y: canvasY,
            content,
            font: "sans",
            fontSize: 14,
            color: "#000000",
          };

          //   this.existingShapes.push(this.tempShape);

          this.socket.send(
            JSON.stringify({
              MESSAGE_TYPE: "shape",
              shape: this.tempShape,
              roomId: this.roomId,
            })
          );
          this.clearCanvas();
          document.body.removeChild(input);

          this.hasInput = false;
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input.addEventListener("keydown", (event: any) => {
        if (event.key === "Enter") {
          input.blur();
        }
      });
    }

    console.log(this.drawing);
  };

  mouseMoveHandler = (e: MouseEvent) => {
    if (this.selectedShape === "erase" && this.drawing) {
      this.eraseAt(e.offsetX, e.offsetY);
      return;
    }
    // console.log(this.drawing)
    if (this.drawing) {
      console.log("control reached here | mouse_MOVE", this.drawing);

      const currentX = e.clientX;
      const currentY = e.clientY;
      // let tempShape = {};
      // Clear and redraw existing shapes
      this.clearCanvas();

      // Use the activeTool that was captured when drawing started
      // console.log("ERROR IN MOUSEMOVEHANDLER", this.mouseMoveHandler);
      switch (this.selectedShape) {
        case "rect": {
          const width = currentX - this.startX;
          const height = currentY - this.startY;
          this.ctx.strokeRect(this.startX, this.startY, width, height);
          this.tempShape = {
            type: "rect",
            x: this.startX,
            y: this.startY,
            width,
            height,
          };
          break;
        }
        case "circle": {
          // Support oval shapes like Excalidraw
          const radiusX = Math.abs(currentX - this.startX);
          const radiusY = Math.abs(currentY - this.startY);

          this.ctx.beginPath();
          this.ctx.ellipse(
            this.startX,
            this.startY,
            radiusX,
            radiusY,
            0,
            0,
            2 * Math.PI
          );
          this.ctx.stroke();

          this.tempShape = {
            type: "circle",
            centerX: this.startX,
            centerY: this.startY,
            radiusX,
            radiusY,
          };
          break;
        }
        case "rhombus": {
          const width = currentX - this.startX;
          const height = currentY - this.startY;
          const centerX = this.startX + width / 2;
          const centerY = this.startY + height / 2;
          this.ctx.beginPath();
          this.ctx.moveTo(centerX, this.startY); // top
          this.ctx.lineTo(currentX, centerY); // right
          this.ctx.lineTo(centerX, currentY); // bottom
          this.ctx.lineTo(this.startX, centerY); // left
          this.ctx.closePath();
          this.ctx.stroke();
          this.tempShape = {
            type: "rhombus",
            x: this.startX,
            y: this.startY,
            width,
            height,
          };
          break;
        }
        case "line": {
          this.ctx.beginPath();
          this.ctx.moveTo(this.startX, this.startY);
          this.ctx.lineTo(currentX, currentY);
          this.ctx.stroke();
          this.tempShape = {
            type: "line",
            x1: this.startX,
            y1: this.startY,
            x2: currentX,
            y2: currentY,
          };
          break;
        }
        case "arrow": {
          this.tempShape = {
            type: "arrow",
            x1: this.startX,
            y1: this.startY,
            x2: currentX,
            y2: currentY,
          };
          this.drawArrow(this.tempShape);
          break;
        }
        case "pencil": {
          this.pencilPoints.push({ x: currentX, y: currentY });
          this.ctx.beginPath();
          this.ctx.moveTo(this.pencilPoints[0].x, this.pencilPoints[0].y);
          this.pencilPoints.forEach((pt) => this.ctx.lineTo(pt.x, pt.y));
          this.ctx.stroke();
          this.tempShape = { type: "pencil", points: [...this.pencilPoints] };
          break;
        }
        // text case is handled in moveDown handler
        default:
          this.tempShape = {};
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseUpHandler = (e: MouseEvent) => {
    if (this.selectedShape === "erase") {
      this.drawing = false;
      return;
    }
    console.log("control reached here | mouse_UP");
    // console.log(this.drawing)
    this.drawing = false;
    console.log(this.tempShape);
    if (this.tempShape) {
      this.existingShapes.push(this.tempShape);
      this.clearCanvas();
      this.socket.send(
        JSON.stringify({
          MESSAGE_TYPE: "shape",
          shape: this.tempShape,
          roomId: this.roomId,
        })
      );
    }
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
  }
}
