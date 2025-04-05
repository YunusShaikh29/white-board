import { useEffect, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { Game } from "@/draw/Game";
import { Tool, Theme, Color } from "@/util/type";
import { AlignJustify } from "lucide-react";
import { Sidebar } from "./Sidebar";

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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [theme, setTheme] = useState<Theme>("rgb(24,24,27)");
  const [selectedColor, setSelectedColor] = useState<Color>("#ffffff");

  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
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
      return () => newGame.destroy();
    }
  }, [canvasRef, roomId, socket, dimensions]);

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    game?.setColor(selectedColor);
  }, [game, selectedColor]);

  useEffect(() => {
    game?.setTheme(theme);
  }, [game, theme]);

  return (
    <div className="flex-1 overflow-hidden relative">
      <canvas
        ref={canvasRef}
        className={`touch-none ${
          theme === "rgb(24,24,27)" ? "bg-zinc-900" : "bg-white"
        }`}
        style={{ width: dimensions.width, height: dimensions.height }}
      />
      <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
      <button
        onClick={() => setSidebarVisible((prev) => !prev)}
        className={`fixed top-16 left-16 p-2 rounded-md ${
          theme === "rgb(24,24,27)" 
            ? "bg-zinc-700 text-white" 
            : "bg-gray-200 text-gray-700"
        } shadow-md z-40`}
        title="Open Settings"
      >
        <AlignJustify size={20} />
      </button>
      {sidebarVisible && (
        <Sidebar
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          theme={theme}
          setTheme={setTheme}
          onClose={() => setSidebarVisible(false)}
        />
      )}
    </div>
  );
}