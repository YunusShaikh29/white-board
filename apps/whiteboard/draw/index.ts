import axios from "axios";

type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      height: number;
      width: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    };

export default async function initDraw(
  canvas: HTMLCanvasElement,
  roomId: string,
  socket: WebSocket
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const existingShape: Shape[] = await getExistingShapes(roomId);

  socket.onmessage = (event) => {
    const shapesData = JSON.parse(event.data);
    console.log(shapesData);
    if (shapesData.MESSAGE_TYPE === "shape") {
      if (shapesData.shape) {
        const formattedShape = {
          ...shapesData.shape,
          shapeType: shapesData.shape.shapeType,
        };
        existingShape.push(formattedShape);
        clearCanvas(existingShape, canvas, ctx);
      }
    }
  };

  clearCanvas(existingShape, canvas, ctx);
  let clicked = false;
  let startX = 0;
  let startY = 0;

  canvas.addEventListener("mousedown", (e) => {
    clicked = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  canvas.addEventListener("mouseup", (e) => {
    clicked = false;
    const width = e.clientX - startX;
    const height = e.clientY - startY;

    const shape: Shape = {
      type: "rect",
      x: startX,
      y: startY,
      width,
      height,
    };

    existingShape.push(shape);
    clearCanvas(existingShape, canvas, ctx);

    // Send the shape as an object instead of stringifying it
    socket.send(
      JSON.stringify({
        MESSAGE_TYPE: "shape",
        shape, // <-- Send object directly
        roomId,
      })
    );
  });

  canvas.addEventListener("mousemove", (e) => {
    if (clicked) {
      const width = e.clientX - startX;
      const height = e.clientY - startY;
      clearCanvas(existingShape, canvas, ctx);
      ctx.strokeRect(startX, startY, width, height);
    }
  });
}

function clearCanvas(
  existingShape: Shape[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  existingShape.forEach((shape) => {
    if (shape.type === "rect") {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
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
