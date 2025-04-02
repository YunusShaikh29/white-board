import { useEffect, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { Game } from "@/draw/Game";
import { Tool } from "@/util/type";

export function Canvas({
  roomId,
  socket,
}: {
  roomId: string;
  socket: WebSocket;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [selectedTool, setSelectedTool] = useState<Tool>("rect");
  const [game, setGame] = useState<Game>();

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      const newGame = new Game(canvas, roomId, socket);
      setGame(newGame);

      return () => {
        newGame.destroy();
      };
    }
  }, [canvasRef, roomId, socket, dimensions]);

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  return (
    <div className="flex-1 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="touch-none"
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      />
      <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
    </div>
  );
}
