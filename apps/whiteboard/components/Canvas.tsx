import initDraw from "@/draw";
import useToolStore from "@/store/toolStore";
import { useEffect, useRef, useState } from "react";

export function Canvas({
  roomId,
  socket,
}: {
  roomId: string;
  socket: WebSocket;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentTool } = useToolStore();
  console.log("current selected tool, canvas.tsx file", currentTool)
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1000,
    height: typeof window !== "undefined" ? window.innerHeight : 1000,
  }));

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize drawing with updated canvas dimensions
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      // Set the actual canvas resolution
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      initDraw(canvas, roomId, socket, currentTool);
    }
  }, [canvasRef, roomId, socket, dimensions, currentTool]);

  return (
    <div className="flex-1 overflow-hidden">
      {/* Use style to ensure canvas fills its container */}
      <canvas
        ref={canvasRef}
        className="touch-none"
        style={{ width: "100%", height: "100%" }}
      ></canvas>
    </div>
  );
}
