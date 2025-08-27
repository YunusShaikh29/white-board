/* eslint-disable @typescript-eslint/no-explicit-any */
import { getExistingShapes } from "./http";
import { Shape, Point, Tool, Color, Theme, StrokeWidth } from "@/util/type";
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
  private strokeWidth: StrokeWidth = 2;
  private theme: Theme = "rgb(24,24,27)";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tempShape: any;
  private _selectedShape: Tool | null;
  private hasInput: boolean = false;
  private pencilPoints: Point[];
  private offsetX: number = 0;
  private offsetY: number = 0;
  private zoom: number = 1;
  private isPanning: boolean = false;
  private panStartX: number = 0;
  private panStartY: number = 0;
  private onZoomChange?: (zoom: number) => void;
  private onToolChange?: (tool: Tool) => void;
  private selectedShapeIndex: number = -1;  // Use index instead of ID for selection
  private isMoving: boolean = false;
  private moveStartX: number = 0;
  private moveStartY: number = 0;
  
  // Resize functionality
  private isResizing: boolean = false;
  private resizeHandle: string | null = null; // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
  private resizeStartX: number = 0;
  private resizeStartY: number = 0;
  private originalShape: any = null; // Store original shape for resizing
  
  // Undo/Redo functionality
  private history: Shape[][] = [];
  private historyIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(canvas: HTMLCanvasElement, roomId: number, socket: WebSocket, onZoomChange?: (zoom: number) => void, onToolChange?: (tool: Tool) => void) {
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
    this.canvas.addEventListener("wheel", this.handleWheel);
    
    // Add keyboard shortcuts for undo/redo
    this.initKeyboardHandlers();
    this.onZoomChange = onZoomChange;
    this.onToolChange = onToolChange;
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    
    // Clean up keyboard handler
    if ((this as any).keyboardHandler) {
      document.removeEventListener('keydown', (this as any).keyboardHandler);
    }
    
    // Clean up any existing text input
    const existingInput = document.querySelector('input[data-canvas-input="true"]');
    if (existingInput) {
      existingInput.remove();
    }
    this.selectedShapeIndex = -1;
    this.isMoving = false;
  }

  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.saveToHistory(); // Save initial state
    this.clearCanvas();
  }
  
  // Save current state to history
  private saveToHistory() {
    // Remove any history after current index (when user does action after undo)
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Deep clone the shapes to avoid reference issues
    const currentState = JSON.parse(JSON.stringify(this.existingShapes));
    this.history.push(currentState);
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
    
    console.log("HISTORY SAVED - Index:", this.historyIndex, "Total:", this.history.length);
  }
  
  // Undo last action
  public undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.existingShapes = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.selectedShapeIndex = -1; // Clear selection
      this.clearCanvas();
      console.log("UNDO - Index:", this.historyIndex);
      return true;
    }
    console.log("UNDO - No more history");
    return false;
  }
  
  // Redo last undone action
  public redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.existingShapes = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.selectedShapeIndex = -1; // Clear selection
      this.clearCanvas();
      console.log("REDO - Index:", this.historyIndex);
      return true;
    }
    console.log("REDO - No more future history");
    return false;
  }
  
  // Check if undo is possible
  public canUndo(): boolean {
    return this.historyIndex > 0;
  }
  
  // Check if redo is possible
  public canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // Clear all shapes from canvas
  public clearAllShapes(): void {
    console.log("CLEARING ALL SHAPES");
    this.existingShapes = [];
    this.selectedShapeIndex = -1;
    this.saveToHistory();
    this.clearCanvas();
    
    // Broadcast clear message to other users
    try {
      this.socket.send(
        JSON.stringify({
          MESSAGE_TYPE: "clear_all",
          roomId: this.roomId,
        })
      );
    } catch (e) {
      console.log("Error sending clear_all message", e);
    }
  }

  // Delete the currently selected shape
  public deleteSelectedShape(): void {
    if (this.selectedShapeIndex === -1 || this.selectedShapeIndex >= this.existingShapes.length) {
      return;
    }

    const shapeToDelete = this.existingShapes[this.selectedShapeIndex];
    console.log("DELETING SELECTED SHAPE:", shapeToDelete?.type, "Index:", this.selectedShapeIndex);

    // Remove from local array
    this.existingShapes.splice(this.selectedShapeIndex, 1);
    
    // Clear selection
    this.selectedShapeIndex = -1;
    
    // Save to history
    this.saveToHistory();
    
    // Redraw canvas
    this.clearCanvas();

    // Only broadcast if the shape has an ID (came from server)
    if ((shapeToDelete as any)?.id) {
      try {
        this.socket.send(
          JSON.stringify({
            MESSAGE_TYPE: "erase",
            shapeIds: [(shapeToDelete as any).id],
            roomId: this.roomId,
          })
        );
      } catch (e) {
        console.log("Error sending delete message", e);
      }
    }
  }

  // Duplicate the currently selected shape
  public duplicateSelectedShape(): void {
    if (this.selectedShapeIndex === -1 || this.selectedShapeIndex >= this.existingShapes.length) {
      return;
    }

    const originalShape = this.existingShapes[this.selectedShapeIndex];
    console.log("DUPLICATING SELECTED SHAPE:", originalShape?.type, "Index:", this.selectedShapeIndex);

    // Create a deep copy of the shape
    const duplicatedShape = JSON.parse(JSON.stringify(originalShape));
    
    // Remove server-specific properties
    delete (duplicatedShape as any).id;
    delete (duplicatedShape as any).createdAt;
    delete (duplicatedShape as any).updatedAt;
    
    // Add local flags
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    (duplicatedShape as any)._isLocal = true;
    (duplicatedShape as any)._tempId = tempId;

    // Offset the duplicated shape position by 20px
    const offset = 20 / this.zoom; // Adjust for zoom level
    
    if (duplicatedShape.type === "rect" || duplicatedShape.type === "rhombus" || duplicatedShape.type === "text") {
      (duplicatedShape as any).x += offset;
      (duplicatedShape as any).y += offset;
    } else if (duplicatedShape.type === "circle") {
      (duplicatedShape as any).centerX += offset;
      (duplicatedShape as any).centerY += offset;
    } else if (duplicatedShape.type === "line" || duplicatedShape.type === "arrow") {
      (duplicatedShape as any).x1 += offset;
      (duplicatedShape as any).y1 += offset;
      (duplicatedShape as any).x2 += offset;
      (duplicatedShape as any).y2 += offset;
    } else if (duplicatedShape.type === "pencil") {
      const points = this.getShapePoints(duplicatedShape);
      if (points) {
        (duplicatedShape as any).points = points.map((pt: any) => ({ 
          x: pt.x + offset, 
          y: pt.y + offset 
        }));
      }
    }

    // Add to existing shapes and select the new shape
    this.existingShapes.push(duplicatedShape);
    this.selectedShapeIndex = this.existingShapes.length - 1;
    
    // Save to history
    this.saveToHistory();
    
    // Redraw canvas
    this.clearCanvas();

    // Send to server
    const shapeToSend = { ...duplicatedShape, _tempId: tempId };
    try {
      this.socket.send(
        JSON.stringify({
          MESSAGE_TYPE: "shape",
          shape: shapeToSend,
          roomId: this.roomId,
        })
      );
    } catch (e) {
      console.log("Error sending duplicated shape", e);
    }
  }
  
  // Zoom in by fixed amount
  public zoomIn() {
    const newZoom = Math.min(this.zoom + 0.1, 10);
    this.setZoom(newZoom, this.canvas.width / 2, this.canvas.height / 2);
  }
  
  // Zoom out by fixed amount  
  public zoomOut() {
    const newZoom = Math.max(this.zoom - 0.1, 0.1);
    this.setZoom(newZoom, this.canvas.width / 2, this.canvas.height / 2);
  }
  
  // Set zoom to specific value with center point
  private setZoom(newZoom: number, centerX: number, centerY: number) {
    const oldZoom = this.zoom;
    this.zoom = newZoom;
    
    // Adjust offset to zoom towards center point
    this.offsetX = centerX - (centerX - this.offsetX) * (this.zoom / oldZoom);
    this.offsetY = centerY - (centerY - this.offsetY) * (this.zoom / oldZoom);
    
    this.clearCanvas();
    if (this.onZoomChange) {
      this.onZoomChange(this.zoom);
    }
  }
  
  // Helper function to safely get points array from shape
  private getShapePoints(shape: any): Point[] | null {
    if (!shape?.points) return null;
    
    let points = shape.points;
    
    // Handle case where points might be a JSON string (from database)
    if (typeof points === 'string') {
      try {
        points = JSON.parse(points);
      } catch (e) {
        console.error("Failed to parse shape points:", e);
        return null;
      }
    }
    
    return Array.isArray(points) ? points : null;
  }

  // Get bounding box of a shape
  private getShapeBounds(shape: any) {
    switch (shape?.type) {
      case "rect":
      case "rhombus":
        return {
          minX: Math.min(shape.x, shape.x + shape.width),
          minY: Math.min(shape.y, shape.y + shape.height),
          maxX: Math.max(shape.x, shape.x + shape.width),
          maxY: Math.max(shape.y, shape.y + shape.height),
          width: Math.abs(shape.width),
          height: Math.abs(shape.height)
        };
      case "circle":
        return {
          minX: shape.centerX - shape.radiusX,
          minY: shape.centerY - shape.radiusY,
          maxX: shape.centerX + shape.radiusX,
          maxY: shape.centerY + shape.radiusY,
          width: shape.radiusX * 2,
          height: shape.radiusY * 2
        };
      case "line":
      case "arrow":
        return {
          minX: Math.min(shape.x1, shape.x2),
          minY: Math.min(shape.y1, shape.y2),
          maxX: Math.max(shape.x1, shape.x2),
          maxY: Math.max(shape.y1, shape.y2),
          width: Math.abs(shape.x2 - shape.x1),
          height: Math.abs(shape.y2 - shape.y1)
        };
      case "text":
        // More accurate text width estimation
        const textWidth = shape.content ? 
          shape.content.length * (shape.fontSize * 0.6) : 
          Math.max(100, shape.fontSize * 6); // Minimum width for empty text
        return {
          minX: shape.x,
          minY: shape.y - shape.fontSize,
          maxX: shape.x + textWidth,
          maxY: shape.y,
          width: textWidth,
          height: shape.fontSize
        };
      case "pencil":
        const points = this.getShapePoints(shape);
        if (points && points.length > 0) {
          const xs = points.map((p: any) => p.x);
          const ys = points.map((p: any) => p.y);
          return {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys)
          };
        }
        break;
    }
    return null;
  }
  
  // Draw resize handles around selected shape
  private drawResizeHandles(shape: any) {
    const bounds = this.getShapeBounds(shape);
    if (!bounds) return;
    
    const handleSize = 8 / this.zoom; // Size of resize handles, adjusted for zoom
    const { minX, minY, maxX, maxY } = bounds;
    
    this.ctx.save();
    this.ctx.fillStyle = "#4f46e5"; // Indigo color for handles
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 1 / this.zoom;
    
    // Draw 8 resize handles: corners + midpoints
    const handles = [
      { x: minX, y: minY, type: 'nw' },           // Top-left
      { x: (minX + maxX) / 2, y: minY, type: 'n' }, // Top-center
      { x: maxX, y: minY, type: 'ne' },           // Top-right
      { x: maxX, y: (minY + maxY) / 2, type: 'e' }, // Right-center
      { x: maxX, y: maxY, type: 'se' },           // Bottom-right
      { x: (minX + maxX) / 2, y: maxY, type: 's' }, // Bottom-center
      { x: minX, y: maxY, type: 'sw' },           // Bottom-left
      { x: minX, y: (minY + maxY) / 2, type: 'w' }  // Left-center
    ];
    
    handles.forEach(handle => {
      this.ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.strokeRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });
    
    this.ctx.restore();
  }
  
  // Check if a point is over a resize handle
  private getResizeHandle(shape: any, x: number, y: number): string | null {
    const bounds = this.getShapeBounds(shape);
    if (!bounds) return null;
    
    const handleSize = 8 / this.zoom;
    const tolerance = handleSize / 2;
    const { minX, minY, maxX, maxY } = bounds;
    
    const handles = [
      { x: minX, y: minY, type: 'nw' },
      { x: (minX + maxX) / 2, y: minY, type: 'n' },
      { x: maxX, y: minY, type: 'ne' },
      { x: maxX, y: (minY + maxY) / 2, type: 'e' },
      { x: maxX, y: maxY, type: 'se' },
      { x: (minX + maxX) / 2, y: maxY, type: 's' },
      { x: minX, y: maxY, type: 'sw' },
      { x: minX, y: (minY + maxY) / 2, type: 'w' }
    ];
    
    for (const handle of handles) {
      if (Math.abs(x - handle.x) <= tolerance && Math.abs(y - handle.y) <= tolerance) {
        return handle.type;
      }
    }
    
    return null;
  }
  
  // Get appropriate cursor for resize handle
  private getResizeCursor(handle: string): string {
    switch (handle) {
      case 'nw':
      case 'se':
        return 'nw-resize';
      case 'ne':
      case 'sw':
        return 'ne-resize';
      case 'n':
      case 's':
        return 'ns-resize';
      case 'e':
      case 'w':
        return 'ew-resize';
      default:
        return 'default';
    }
  }
  
  // Apply resize transformation to shape
  private resizeShape(shape: any, handle: string, deltaX: number, deltaY: number) {
    const originalBounds = this.getShapeBounds(this.originalShape);
    if (!originalBounds) return;

    let newMinX = originalBounds.minX;
    let newMinY = originalBounds.minY;
    let newMaxX = originalBounds.maxX;
    let newMaxY = originalBounds.maxY;

    // Apply resize based on handle direction
    switch (handle) {
      case 'nw':
        newMinX += deltaX;
        newMinY += deltaY;
        break;
      case 'ne':
        newMaxX += deltaX;
        newMinY += deltaY;
        break;
      case 'sw':
        newMinX += deltaX;
        newMaxY += deltaY;
        break;
      case 'se':
        newMaxX += deltaX;
        newMaxY += deltaY;
        break;
      case 'n':
        newMinY += deltaY;
        break;
      case 's':
        newMaxY += deltaY;
        break;
      case 'w':
        newMinX += deltaX;
        break;
      case 'e':
        newMaxX += deltaX;
        break;
    }

    // Ensure minimum size
    const minSize = 10;
    if (newMaxX - newMinX < minSize) {
      if (handle.includes('w')) newMinX = newMaxX - minSize;
      if (handle.includes('e')) newMaxX = newMinX + minSize;
    }
    if (newMaxY - newMinY < minSize) {
      if (handle.includes('n')) newMinY = newMaxY - minSize;
      if (handle.includes('s')) newMaxY = newMinY + minSize;
    }

    const newWidth = newMaxX - newMinX;
    const newHeight = newMaxY - newMinY;

    // Apply changes based on shape type
    switch (shape?.type) {
      case 'rect':
      case 'rhombus':
        shape.x = newMinX;
        shape.y = newMinY;
        shape.width = newWidth;
        shape.height = newHeight;
        break;
      case 'circle':
        shape.centerX = (newMinX + newMaxX) / 2;
        shape.centerY = (newMinY + newMaxY) / 2;
        shape.radiusX = newWidth / 2;
        shape.radiusY = newHeight / 2;
        break;
      case 'line':
      case 'arrow':
        shape.x1 = newMinX;
        shape.y1 = newMinY;
        shape.x2 = newMaxX;
        shape.y2 = newMaxY;
        break;
      case 'text':
        shape.x = newMinX;
        shape.y = newMaxY; // Text y is baseline
        
        // Calculate scale factor based on height change
        const heightScale = newHeight / originalBounds.height;
        const originalFontSize = this.originalShape.fontSize || 16;
        shape.fontSize = Math.max(8, Math.round(originalFontSize * heightScale));
        break;
      case 'pencil':
        // Scale pencil points
        const originalPoints = this.getShapePoints(this.originalShape);
        if (originalPoints && originalBounds) {
          const scaleX = newWidth / originalBounds.width;
          const scaleY = newHeight / originalBounds.height;
          shape.points = originalPoints.map((p: any) => ({
            x: newMinX + (p.x - originalBounds.minX) * scaleX,
            y: newMinY + (p.y - originalBounds.minY) * scaleY
          }));
        }
        break;
    }
  }

  initHandler() {
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.MESSAGE_TYPE === "shape" && data.shape) {
        // Check if this is a server response to our local shape using tempId
        const localShapeIndex = this.existingShapes.findIndex(shape => 
          (shape as any)._isLocal && 
          (shape as any)._tempId && 
          (shape as any)._tempId === (data.shape as any)._tempId
        );
        
        if (localShapeIndex !== -1) {
          // Replace local shape with server shape
          console.log("REPLACING LOCAL SHAPE WITH SERVER SHAPE:", data.shape?.type, "TempID:", (data.shape as any)._tempId, "ServerID:", data.shape.id);
          
          // Clean server shape (remove temp properties)
          const cleanServerShape = { ...data.shape };
          delete (cleanServerShape as any)._tempId;
          delete (cleanServerShape as any)._isLocal;
          
          this.existingShapes[localShapeIndex] = cleanServerShape;
          
          // Update selectedShapeIndex if it was pointing to the replaced shape
          if (this.selectedShapeIndex === localShapeIndex) {
            // Keep the same index since we're replacing, not adding
          }
        } else {
          // This is a shape from another user (no tempId match)
          console.log("ADDING SHAPE FROM OTHER USER:", data.shape?.type, "ID:", data.shape.id);
          
          // Clean the shape before adding
          const cleanShape = { ...data.shape };
          delete (cleanShape as any)._tempId;
          delete (cleanShape as any)._isLocal;
          
          this.existingShapes.push(cleanShape);
        }
        this.clearCanvas();
      }
      if (data.MESSAGE_TYPE === "erase" && data.shapeIds) {
        this.existingShapes = this.existingShapes.filter(
          shape => !data.shapeIds.includes((shape as any)?.id || -1)
        );
        this.clearCanvas();
      }

      // Handle clear all message
      if (data.MESSAGE_TYPE === "clear_all") {
        console.log("RECEIVED CLEAR_ALL MESSAGE");
        this.existingShapes = [];
        this.selectedShapeIndex = -1;
        this.saveToHistory();
        this.clearCanvas();
      }
      
      // Handle shape updates (from resize/move operations)
      if (data.MESSAGE_TYPE === "shape_updated" && data.shape) {
        const updatedShape = data.shape;
        const shapeIndex = this.existingShapes.findIndex(
          shape => (shape as any)?.id === updatedShape.id
        );
        
        if (shapeIndex !== -1) {
          // Update the existing shape
          console.log("UPDATING EXISTING SHAPE:", updatedShape.type, "ID:", updatedShape.id);
          this.existingShapes[shapeIndex] = updatedShape;
          
          // Update selectedShapeIndex if it was pointing to the updated shape
          if (this.selectedShapeIndex === shapeIndex) {
            // Keep the same index since we're updating, not adding
          }
          
          this.clearCanvas();
        }
      }
    };
  }

  // Update setTool to reset states and cursor
  setTool(tool: Tool) {
    console.log("SWITCHING TO TOOL:", tool);
    this.selectedShape = tool;
    this.isPanning = false;
    this.isMoving = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.originalShape = null;
    if (tool !== "select") {
      this.selectedShapeIndex = -1;
    }
    if (tool === "hand") {
      this.canvas.style.cursor = "grab";
    } else if (tool === "select") {
      this.canvas.style.cursor = "default";
    } else if (tool === "erase" || tool === "line" || tool === "arrow") {
      this.canvas.style.cursor = "crosshair";
    } else {
      this.canvas.style.cursor = "default";
    }
    this.clearCanvas();  // Redraw to update highlight if deselected
  }

  eraseAt(x: number, y: number) {
    // Convert screen coordinates to world coordinates
    const worldX = (x - this.offsetX) / this.zoom;
    const worldY = (y - this.offsetY) / this.zoom;
    const eraserRadius = 20 / this.zoom; // Adjust radius for zoom
    
    const erasedShapeIds: number[] = [];
    const erasedIndices: number[] = [];
    
    this.existingShapes = this.existingShapes.filter((shape, index) => {
      const hit = this.shapeIntersectsEraser(shape, worldX, worldY, eraserRadius);
      if (hit) {
        if ((shape as any)?.id) {
          erasedShapeIds.push((shape as any).id);
        }
        erasedIndices.push(index);
        console.log("ERASING SHAPE:", shape?.type, "at index:", index);
        return false; // Remove from local array
      }
      return true; // Keep in local array
    });
  
    if (erasedIndices.length > 0) {
      // Update selectedShapeIndex if the selected shape was erased
      if (this.selectedShapeIndex !== -1) {
        if (erasedIndices.includes(this.selectedShapeIndex)) {
          this.selectedShapeIndex = -1;
        } else {
          // Adjust index if shapes before the selected one were removed
          const removedBefore = erasedIndices.filter(i => i < this.selectedShapeIndex).length;
          this.selectedShapeIndex -= removedBefore;
        }
      }
      
      this.saveToHistory(); // Save state after erasing shapes
      this.clearCanvas();
      
      // Only broadcast if we have shapes with IDs (from server)
      if (erasedShapeIds.length > 0) {
        this.socket.send(
          JSON.stringify({
            MESSAGE_TYPE: "erase",
            shapeIds: erasedShapeIds,
            roomId: this.roomId,
          })
        );
      }
    }
  }

  shapeIntersectsEraser(shape: any, x: number, y: number, radius: number) {
    // Rect
    if (shape?.type === "rect" || shape?.type === "rhombus") {
      return (
        x + radius > shape.x &&
        x - radius < shape.x + shape.width &&
        y + radius > shape.y &&
        y - radius < shape.y + shape.height
      );
    }
    // Circle
    if (shape?.type === "circle") {
      const dx = x - shape.centerX;
      const dy = y - shape.centerY;
      return Math.sqrt(dx * dx + dy * dy) < (shape.radiusX || shape.radius) + radius;
    }
    // Line/Arrow
    if (shape?.type === "line" || shape?.type === "arrow") {
      const dist = this.pointToSegmentDistance(x, y, shape.x1, shape.y1, shape.x2, shape.y2);
      return dist < radius;
    }
    // Pencil
    if (shape?.type === "pencil") {
      const points = this.getShapePoints(shape);
      if (points) {
        return points.some(pt => Math.hypot(pt.x - x, pt.y - y) < radius);
      }
    }
    // Text
    if (shape?.type === "text") {
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

  setStrokeWidth(width: StrokeWidth) {
    this.strokeWidth = width;
    this.ctx.lineWidth = width;
    this.clearCanvas();
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
      // Use the shape's fontSize property
      const fontSize = (shape as any).fontSize || 16;
      this.ctx.font = `${fontSize}px Arial`;
      
      // Set text color based on theme
      this.ctx.fillStyle =
        this.theme === "rgb(24,24,27)" ? "#ffffff" : "#000000";
      this.ctx.fillText(shape.content, shape.x, shape.y);
    }
  }

  drawRect(shape: Shape) {
    if (shape?.type === "rect") {
      this.ctx.strokeStyle = this.selecteColor;
      this.ctx.lineWidth = this.strokeWidth;
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
      const points = this.getShapePoints(shape);
      
      if (points && points.length > 0) {
        this.ctx.strokeStyle = this.selecteColor.toString();
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        points.forEach((pt) => this.ctx.lineTo(pt.x, pt.y));
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
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.theme;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.zoom, this.zoom);

    this.existingShapes.forEach((shape, i) => {
      if (!shape) return;

      this.ctx.strokeStyle =
        this.theme === "rgb(24,24,27)" ? "#ffffff" : "#000000";
      this.ctx.lineWidth = this.strokeWidth;

      switch (shape?.type) {
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
      
      // Draw selection highlight and resize handles if this shape is selected
      if (i === this.selectedShapeIndex && shape) {
        this.ctx.save();
        this.ctx.strokeStyle = "blue";
        this.ctx.lineWidth = 2 / this.zoom;
        
        const bounds = this.getShapeBounds(shape);
        if (bounds) {
          const { minX, minY, maxX, maxY } = bounds;
          // Draw selection outline
          this.ctx.strokeRect(minX - 4/this.zoom, minY - 4/this.zoom, (maxX - minX) + 8/this.zoom, (maxY - minY) + 8/this.zoom);
        }
        this.ctx.restore();
        
        // Draw resize handles
        this.drawResizeHandles(shape);
      }
    });
    this.ctx.restore();
  }

  handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(this.zoom + delta, 0.1), 10);
    
    // Zoom towards mouse position
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    
    this.offsetX = mouseX - (mouseX - this.offsetX) * (newZoom / this.zoom);
    this.offsetY = mouseY - (mouseY - this.offsetY) * (newZoom / this.zoom);
    
    this.zoom = newZoom;
    this.onZoomChange?.(this.zoom);
    this.clearCanvas();
  };

  mouseDownHandler = (e: MouseEvent) => {
    if (this.selectedShape === "erase") {
      this.drawing = true;
      this.eraseAt(e.offsetX, e.offsetY);
      return;
    }
    console.log("control reached here, mouse_DOWN");
    this.drawing = true;
    this.startX = (e.offsetX - this.offsetX) / this.zoom;
    this.startY = (e.offsetY - this.offsetY) / this.zoom;

    if (this.selectedShape === "pencil") {
      this.pencilPoints = [{ x: this.startX, y: this.startY }];
      this.existingShapes.push({ type: "pencil", points: this.pencilPoints });
    }

    if (this.selectedShape === "text") {
      const canvasX = e.offsetX;
      const canvasY = e.offsetY;
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
      input.style.background = "transparent";
      input.style.border = "none";
      input.style.outline = "none";
      input.style.color = this.theme === "rgb(24,24,27)" ? "#ffffff" : "#000000";
      input.setAttribute("data-canvas-input", "true");

      this.canvas.parentElement?.appendChild(input);

      input.focus();

      input.addEventListener("blur", () => {
        console.log(input.value);
        const content = input.value;

        if (content.trim().length !== 0 || content.trim() !== "") {
          // Convert screen coordinates to world coordinates for text position
          const worldX = (canvasX - this.offsetX) / this.zoom;
          const worldY = (canvasY - this.offsetY) / this.zoom;
          
          this.tempShape = {
            type: "text",
            x: worldX,
            y: worldY,
            content,
            font: "sans",
            fontSize: 16, // Default font size
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
          input.remove();

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

    if (this.selectedShape === "hand") {
      this.isPanning = true;
      this.panStartX = e.offsetX - this.offsetX;
      this.panStartY = e.offsetY - this.offsetY;
      this.canvas.style.cursor = "grabbing";
      return;
    }

    if (this.selectedShape === "select") {
      const worldX = (e.offsetX - this.offsetX) / this.zoom;
      const worldY = (e.offsetY - this.offsetY) / this.zoom;
      
      console.log("SELECT MODE: Clicking at world coords", worldX, worldY);
      console.log("Available shapes:", this.existingShapes.length);
      
      // First check if clicking on a resize handle of selected shape
      if (this.selectedShapeIndex !== -1 && this.selectedShapeIndex < this.existingShapes.length) {
        const selectedShape = this.existingShapes[this.selectedShapeIndex];
        const handle = this.getResizeHandle(selectedShape, worldX, worldY);
        
        if (handle) {
          console.log("STARTING RESIZE with handle:", handle);
          this.isResizing = true;
          this.resizeHandle = handle;
          this.resizeStartX = worldX;
          this.resizeStartY = worldY;
          this.originalShape = JSON.parse(JSON.stringify(selectedShape)); // Deep copy with all properties
          this.canvas.style.cursor = this.getResizeCursor(handle);
          return;
        }
      }
      
      // Find shape under cursor (reverse order for topmost)
      for (let i = this.existingShapes.length - 1; i >= 0; i--) {
        const shape = this.existingShapes[i];
        if (shape && this.shapeIntersectsPoint(shape, worldX, worldY)) {
          console.log("FOUND SHAPE:", shape?.type, "at index:", i, "with ID:", (shape as any)?.id);
          this.selectedShapeIndex = i;  // Use array index instead of ID
          this.isMoving = true;
          this.moveStartX = worldX;
          this.moveStartY = worldY;
          this.canvas.style.cursor = "move";
          this.clearCanvas(); // Redraw to show selection highlight
          return;
        }
      }
      // Deselect if no shape hit
      console.log("NO SHAPE FOUND - Deselecting");
      this.selectedShapeIndex = -1;
      this.clearCanvas(); // Redraw to remove highlight
      return;
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

      const currentX = (e.offsetX - this.offsetX) / this.zoom;
      const currentY = (e.offsetY - this.offsetY) / this.zoom;
      // let tempShape = {};
      // Clear and redraw existing shapes
      this.clearCanvas();

      // Use the activeTool that was captured when drawing started
      // console.log("ERROR IN MOUSEMOVEHANDLER", this.mouseMoveHandler);
      // Apply transformations for drawing temporary shape
      this.ctx.save();
      this.ctx.translate(this.offsetX, this.offsetY);
      this.ctx.scale(this.zoom, this.zoom);
      this.ctx.lineWidth = this.strokeWidth;
      
      switch (this.selectedShape) {
        case "rect": {
          const width = currentX - this.startX;
          const height = currentY - this.startY;
          // Draw temp shape using world coordinates (canvas is now transformed)
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
      
      // Restore canvas transformation after drawing temporary shape
      this.ctx.restore();
    }

    if (this.selectedShape === "select" && !this.drawing && !this.isMoving && !this.isResizing) {
      const worldX = (e.offsetX - this.offsetX) / this.zoom;
      const worldY = (e.offsetY - this.offsetY) / this.zoom;
      
      // Check if hovering over resize handle
      if (this.selectedShapeIndex !== -1 && this.selectedShapeIndex < this.existingShapes.length) {
        const selectedShape = this.existingShapes[this.selectedShapeIndex];
        const handle = this.getResizeHandle(selectedShape, worldX, worldY);
        
        if (handle) {
          this.canvas.style.cursor = this.getResizeCursor(handle);
          return;
        }
      }
      
      let overShape = false;
      for (let i = this.existingShapes.length - 1; i >= 0; i--) {
        const shape = this.existingShapes[i];
        if (shape && this.shapeIntersectsPoint(shape, worldX, worldY)) {
          overShape = true;
          break;
        }
      }
      this.canvas.style.cursor = overShape ? "move" : "default";
    }

    // Update moving logic to use correct coordinates
    if (this.isMoving && this.selectedShapeIndex !== -1) {
        const worldX = (e.offsetX - this.offsetX) / this.zoom;
        const worldY = (e.offsetY - this.offsetY) / this.zoom;
        
        const dx = worldX - this.moveStartX;
        const dy = worldY - this.moveStartY;
        
        if (this.selectedShapeIndex < this.existingShapes.length) {
          const shape = this.existingShapes[this.selectedShapeIndex];
          console.log("MOVING SHAPE:", shape?.type, "by dx:", dx, "dy:", dy);
          
          // Update shape position based on type
          if (shape?.type === "rect" || shape?.type === "rhombus" || shape?.type === "text") {
            (shape as any).x += dx;
            (shape as any).y += dy;
          } else if (shape?.type === "circle") {
            (shape as any).centerX += dx;
            (shape as any).centerY += dy;
          } else if (shape?.type === "line" || shape?.type === "arrow") {
            (shape as any).x1 += dx;
            (shape as any).y1 += dy;
            (shape as any).x2 += dx;
            (shape as any).y2 += dy;
          } else if (shape?.type === "pencil") {
            (shape as any).points = (shape as any).points.map((pt: any) => ({ x: pt.x + dx, y: pt.y + dy }));
          }
          
          this.moveStartX = worldX;
          this.moveStartY = worldY;
          this.clearCanvas();
        }
                return;
      }

      // Handle resizing
      if (this.isResizing && this.selectedShapeIndex !== -1 && this.resizeHandle) {
        const worldX = (e.offsetX - this.offsetX) / this.zoom;
        const worldY = (e.offsetY - this.offsetY) / this.zoom;
        
        const deltaX = worldX - this.resizeStartX;
        const deltaY = worldY - this.resizeStartY;
        
        console.log("RESIZING:", this.resizeHandle, "Delta:", deltaX, deltaY);
        
        if (this.selectedShapeIndex < this.existingShapes.length) {
          const shape = this.existingShapes[this.selectedShapeIndex];
          
          // Create a working copy from original shape and apply resize
          const workingShape = JSON.parse(JSON.stringify(this.originalShape));
          
          // Preserve important properties from current shape
          workingShape.id = (shape as any).id;
          workingShape._isLocal = (shape as any)._isLocal;
          workingShape._tempId = (shape as any)._tempId;
          
          // Apply resize to working shape
          this.resizeShape(workingShape, this.resizeHandle, deltaX, deltaY);
          
          // Replace the shape in the array
          this.existingShapes[this.selectedShapeIndex] = workingShape;
          this.clearCanvas();
        }
        return;
      }

      if (this.selectedShape === "hand" && this.isPanning) {
      this.offsetX = e.offsetX - this.panStartX;
      this.offsetY = e.offsetY - this.panStartY;
      this.clearCanvas();
      return;
    }

    if (this.isPanning) {
      this.offsetX = e.offsetX - this.panStartX;
      this.offsetY = e.offsetY - this.panStartY;
      this.clearCanvas();
      return;
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
      // Add locally with temporary flag and unique ID
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localShape = { ...this.tempShape, _isLocal: true, _tempId: tempId };
      this.existingShapes.push(localShape);
      this.saveToHistory(); // Save state after adding shape
      this.clearCanvas();
      
      console.log("SENDING SHAPE TO SERVER:", this.tempShape.type, "TempID:", tempId);
      
      // Add tempId to the message so server can send it back
      const shapeToSend = { ...this.tempShape, _tempId: tempId };
      this.socket.send(
        JSON.stringify({
          MESSAGE_TYPE: "shape",
          shape: shapeToSend,
          roomId: this.roomId,
        })
      );
    }

    if (this.isMoving) {
      this.isMoving = false;
      this.canvas.style.cursor = "default";
      
      if (this.selectedShapeIndex !== -1 && this.selectedShapeIndex < this.existingShapes.length) {
        const shape = this.existingShapes[this.selectedShapeIndex];
        console.log("FINISHED MOVING SHAPE:", shape?.type);
        
        this.saveToHistory(); // Save state after moving shape
        
        // Only broadcast if shape has an ID (came from server)
        // Local shapes will be handled when they're first sent to server
        if ((shape as any)?.id) {
          this.socket.send(
            JSON.stringify({
              MESSAGE_TYPE: "update_shape",
              shape,
              roomId: this.roomId,
            })
          );
        } else {
          console.log("Local shape moved - will sync when saved to server");
        }
      }
      return;
    }

    if (this.isResizing) {
      this.isResizing = false;
      this.resizeHandle = null;
      this.originalShape = null;
      this.canvas.style.cursor = "default";
      
      if (this.selectedShapeIndex !== -1 && this.selectedShapeIndex < this.existingShapes.length) {
        const shape = this.existingShapes[this.selectedShapeIndex];
        console.log("FINISHED RESIZING SHAPE:", shape?.type);
        
        this.saveToHistory(); // Save state after resizing shape
        
        // Only broadcast if shape has an ID (came from server)
        if ((shape as any)?.id) {
          this.socket.send(
            JSON.stringify({
              MESSAGE_TYPE: "update_shape",
              shape,
              roomId: this.roomId,
            })
          );
        } else {
          console.log("Local shape resized - will sync when saved to server");
        }
      }
      return;
    }

    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.style.cursor = "grab";
      return;
    }

    if (this.selectedShape === "select" && !this.isMoving && this.selectedShapeIndex !== -1) {
      this.selectedShapeIndex = -1;
      this.clearCanvas();
    }
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
  }
  
  initKeyboardHandlers() {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts when user is typing in an input field
      const activeElement = document.activeElement;
      const isTypingInInput = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('data-canvas-input') === 'true'
      );

      // Early exit for typing in input - don't process ANY shortcuts
      if (isTypingInInput) {
        return;
      }

      // Check for Ctrl+Z (undo) or Cmd+Z on Mac
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
        return;
      }
      
      // Check for Ctrl+Y (redo) or Ctrl+Shift+Z or Cmd+Shift+Z on Mac
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z')) {
        e.preventDefault();
        this.redo();
        return;
      }

      // Delete selected shape with Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedShapeIndex !== -1) {
        e.preventDefault();
        this.deleteSelectedShape();
        return;
      }

      // Duplicate selected shape with Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && this.selectedShapeIndex !== -1) {
        e.preventDefault();
        this.duplicateSelectedShape();
        return;
      }

      // Tool shortcuts (only when no modifiers are pressed)
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        const key = e.key.toLowerCase();
        let newTool: Tool | null = null;

        switch (key) {
          case 'r':
            newTool = 'rect';
            break;
          case 'c':
            newTool = 'circle';
            break;
          case 'd':
            newTool = 'rhombus'; // Diamond
            break;
          case 'l':
            newTool = 'line';
            break;
          case 'a':
            newTool = 'arrow';
            break;
          case 'p':
            newTool = 'pencil';
            break;
          case 't':
            newTool = 'text';
            break;
          case 'e':
            newTool = 'erase';
            break;
          case 's':
            newTool = 'select';
            break;
          case 'h':
            newTool = 'hand';
            break;
          case '1':
            newTool = 'point';
            break;
        }

        if (newTool && newTool !== this.selectedShape) {
          e.preventDefault();
          this.setTool(newTool);
          // Notify Canvas component of tool change
          if (this.onToolChange) {
            this.onToolChange(newTool);
          }
          console.log("SWITCHED TO TOOL:", newTool, "via keyboard shortcut:", key);
          return;
        }
      }
    };
    
    // Add global keyboard listener (not just canvas)
    document.addEventListener('keydown', handleKeyDown);
    
    // Store reference for cleanup
    (this as any).keyboardHandler = handleKeyDown;
  }

  private shapeIntersectsPoint(shape: Shape, x: number, y: number) {
    if (!shape) return false;
    
    const padding = 10 / this.zoom; // Increase padding for easier clicking
    let result = false;
    
    if (shape?.type === "rect" || shape?.type === "rhombus") {
      result = x >= (shape.x ?? 0) - padding && x <= (shape.x ?? 0) + (shape.width ?? 0) + padding &&
               y >= (shape.y ?? 0) - padding && y <= (shape.y ?? 0) + (shape.height ?? 0) + padding;
      if (result) console.log("Hit rect/rhombus at", shape.x, shape.y, "size", shape.width, "x", shape.height);
    } else if (shape?.type === "circle") {
      const dx = x - (shape.centerX ?? 0);
      const dy = y - (shape.centerY ?? 0);
      result = Math.sqrt(dx * dx + dy * dy) <= Math.max(shape.radiusX ?? 0, shape.radiusY ?? 0) + padding;
      if (result) console.log("Hit circle at", shape.centerX, shape.centerY);
    } else if (shape?.type === "line" || shape?.type === "arrow") {
      result = this.pointToSegmentDistance(x, y, shape.x1 ?? 0, shape.y1 ?? 0, shape.x2 ?? 0, shape.y2 ?? 0) < padding;
      if (result) console.log("Hit line/arrow");
    } else if (shape?.type === "pencil") {
      const points = this.getShapePoints(shape);
      if (points) {
        result = points.some(pt => Math.hypot((pt?.x ?? 0) - x, (pt?.y ?? 0) - y) < padding);
        if (result) console.log("Hit pencil drawing");
      }
    } else if (shape?.type === "text") {
      result = x >= (shape.x ?? 0) - padding && x <= (shape.x ?? 0) + 100 + padding &&
               y >= (shape.y ?? 0) - (shape.fontSize ?? 0) - padding && y <= (shape.y ?? 0) + padding;
      if (result) console.log("Hit text at", shape.x, shape.y);
    }
    
    return result;
  }
}
