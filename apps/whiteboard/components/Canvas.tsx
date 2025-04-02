// import initDraw from "@/draw";
// import useToolStore from "@/store/toolStore";
import { useEffect, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { Game } from "@/draw/Game";

export type tool =
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

export function Canvas({
  roomId,
  socket,
}: {
  roomId: string;
  socket: WebSocket;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const { currentTool } = useToolStore();

  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1000,
    height: typeof window !== "undefined" ? window.innerHeight : 1000,
  }));

  const [selectedTool, setSelecteTool] = useState<tool>("rect");
  const [game, setGame] = useState<Game>();

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
      // initDraw(canvas, roomId, socket, currentTool);
      const game = new Game(canvas, roomId, socket);
      setGame(game);

      return () => {
        game.destroy();
      };
    }
  }, [canvasRef, roomId, socket, dimensions]);

  console.log("SELECTED TOOL", selectedTool);

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  return (
    <div className="flex-1 overflow-hidden">
      <canvas
        width={1000}
        height={1000}
        ref={canvasRef}
        className="touch-none"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          overflow: "hidden",
        }}
      ></canvas>
      <Toolbar selectedTool={selectedTool} setSelectedTool={setSelecteTool} />
    </div>
  );
}
