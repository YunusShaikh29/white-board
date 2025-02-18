import initDraw from "@/draw";
import { useEffect, useRef } from "react";

export function Canvas({
  roomId,
  socket,
}: {
  roomId: string;
  socket: WebSocket;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {

      const canvas = canvasRef.current;

      if(!canvas) return
      initDraw(canvas, roomId, socket);
    }
  }, [canvasRef, roomId, socket]);

  return (
    <div className="flex-1 overflow-hidden">
      <canvas
        width={1000}
        height={1000}
        ref={canvasRef}
        className="touch-none"
      ></canvas>
    </div>
  );
}
