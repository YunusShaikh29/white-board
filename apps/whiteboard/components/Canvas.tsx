"use client";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Toolbar } from "./Toolbar";
import { Game } from "@/draw/Game";
import { Tool, Theme, Color } from "@/util/type";
import { AlignJustify } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function Canvas({
  roomId,
  socket,
}: {
  roomId: number;
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
  const { theme, toggleTheme } = useTheme();
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
        className={`fixed top-6 left-6 z-40 flex items-center justify-center w-12 h-12 rounded-full border transition-colors
          ${theme === "rgb(24,24,27)" 
            ? "bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            : "bg-white border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-400"}
        `}
        title="Open Settings"
      >
        <AlignJustify size={20} />
      </button>
      {sidebarVisible && (
        <Sidebar
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          onClose={() => setSidebarVisible(false)}
        />
      )}
    </div>
  );
}