import { getExistingShapes } from "./http";
import { Shape, Point, Tool } from "@/util/type";
export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[];
  private roomId: string;
  private socket: WebSocket;
  private drawing: boolean;
  private startX: number = 0;
  private startY: number = 0;
  private selectedShape: Tool = "rect";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tempShape: any;
  private pencilPoints: Point[];

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
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
    };
  }

  setTool(tool: Tool) {
    this.selectedShape = tool;
  }

  drawRect(shape: Shape) {
    if (shape?.type === "rect") {
      this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
  }

  drawCircle(shape: Shape) {
    if (shape?.type === "circle") {
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
      this.ctx.beginPath();
      this.ctx.moveTo(shape.x1, shape.y1);
      this.ctx.lineTo(shape.x2, shape.y2);
      this.ctx.stroke();
    }
  }

  drawArrow(shape: Shape) {
    if (shape?.type === "arrow") {
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
        this.ctx.beginPath();
        this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
        shape.points.forEach((pt) => this.ctx.lineTo(pt.x, pt.y));
        this.ctx.stroke();
      }
    }
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    console.log("error in clearCanvas");
    this.existingShapes.forEach((shape) => {
      if (!shape) return;
      switch (shape.type) {
        case "rect":
          this.drawRect(shape);
          break;
        case "circle":
          this.drawCircle(shape);
          break;
        case "rhombus": {
          this.drawRhombus(shape);
          break;
        }
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
          //   this.ctx.fillText(shape.content, shape.x, shape.y);
          break;
        default:
          break;
      }
    });
  }

  mouseDownHandler = (e: MouseEvent) => {
    console.log("control reached here, mouse_DOWN");
    this.drawing = true;
    this.startX = e.clientX;
    this.startY = e.clientY;

    if (this.selectedShape === "pencil") {
      this.pencilPoints = [{ x: this.startX, y: this.startY }];
      this.existingShapes.push({ type: "pencil", points: this.pencilPoints });
    }

    console.log(this.drawing)
  }

  mouseMoveHandler = (e: MouseEvent) => {
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
    console.log("control reached here | mouse_UP");
    // console.log(this.drawing)
    this.drawing = false;
    console.log(this.tempShape)
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
