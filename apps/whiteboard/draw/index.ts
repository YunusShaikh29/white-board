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

export default async function initDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
  const ctx = canvas.getContext("2d");

  if(!ctx) return;

  const existingShape: Shape[] = await getExistingShapes(roomId);

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)

    if(message.type === "chat") {
      const parsedShape = JSON.parse(message.message)
      existingShape.push(parsedShape)
      clearCanvas(existingShape, canvas, ctx)
    }
  }

  if (!ctx) return;

  clearCanvas(existingShape, canvas, ctx)
  let clicked = false;
  let startX = 0;
  let startY = 0;

  canvas.addEventListener("mousedown", (e) => {
    clicked = true;
    console.log(e.clientX);
    console.log(e.clientY);

    startX = e.clientX;
    startY = e.clientY;
  });
  canvas.addEventListener("mouseup", (e) => {
    clicked = false;
    // console.log(e.clientX);
    // console.log(e.clientY);
    const width = e.clientX - startX;
    const height = e.clientY - startY;

    const shape: Shape = {
      type: "rect",
      x: startX,
      y: startY,
      width,
      height
    }

    existingShape.push(shape);

    socket.send(JSON.stringify({
      type: "chat",
      message: JSON.stringify(shape),
      roomId
    }))

  });

  canvas.addEventListener("mousemove", (e) => {
    
    if (clicked) {
      console.log(e.clientX); 
      console.log(e.clientY);
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

  existingShape.map((shape) => {
    if (shape.type === "rect") {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
   

  });
}


async function getExistingShapes(roomId: string) {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_HTTP_BACKEND}/chats/${roomId}`)
  const messages = res.data.messages

  const shapes = messages.map((x: {message: string}) => {
    const messageShapes = JSON.parse(x.message)
    return messageShapes
  })

  return shapes
}