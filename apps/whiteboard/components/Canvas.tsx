"use client";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Toolbar } from "./Toolbar";
import { Game } from "@/draw/Game";
import { Tool, Color, StrokeWidth } from "@/util/type";
import { AlignJustify, Share2 } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ShareModal } from "./ShareModal";

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
  const { theme } = useTheme();
  const [selectedColor, setSelectedColor] = useState<Color>("#ffffff");
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState<StrokeWidth>(2);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [zoomPercentage, setZoomPercentage] = useState(100);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (canvasRef.current && socket && socket.readyState === WebSocket.OPEN) {
      const canvas = canvasRef.current;
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const newGame = new Game(
        canvas, 
        roomId, 
        socket, 
        (zoom) => {
          setZoomPercentage(Math.round(zoom * 100));
        },
        (tool) => {
          setSelectedTool(tool);
        }
      );
      setGame(newGame);
      setConnectionStatus('connected');
      return () => newGame.destroy();
    } else if (socket && socket.readyState === WebSocket.CONNECTING) {
      setConnectionStatus('connecting');
    } else if (socket && socket.readyState === WebSocket.CLOSED) {
      setConnectionStatus('error');
    }
  }, [canvasRef, roomId, socket, dimensions]);

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    game?.setColor(selectedColor);
  }, [game, selectedColor]);

  useEffect(() => {
    game?.setStrokeWidth(selectedStrokeWidth);
  }, [game, selectedStrokeWidth]);

  useEffect(() => {
    game?.setTheme(theme);
  }, [game, theme]);

  // Check undo/redo state periodically
  useEffect(() => {
    if (!game) return;
    
    const updateUndoRedoState = () => {
      setCanUndo(game.canUndo());
      setCanRedo(game.canRedo());
    };
    
    // Initial check
    updateUndoRedoState();
    
    // Check periodically (could be optimized with events)
    const interval = setInterval(updateUndoRedoState, 100);
    
    return () => clearInterval(interval);
  }, [game]);

  return (
    <div className="w-screen h-screen overflow-hidden relative">

      <canvas
        ref={canvasRef}
        className={`touch-none ${
          theme === "rgb(24,24,27)" ? "bg-zinc-900" : "bg-white"
        }`}
        style={{ width: dimensions.width, height: dimensions.height }}
      />
      
      {/* Connection Status Indicator */}
      {connectionStatus !== 'connected' && (
        <div className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg text-sm font-medium bg-opacity-90 backdrop-blur-sm">
          {connectionStatus === 'connecting' && (
            <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
              <span>Connecting...</span>
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <span>Connection Error</span>
            </div>
          )}
        </div>
      )}
      
      <Toolbar 
        selectedTool={selectedTool} 
        setSelectedTool={setSelectedTool}
        onClearCanvas={() => {
          if (window.confirm("Are you sure you want to clear the entire canvas? This action cannot be undone.")) {
            game?.clearAllShapes();
          }
        }}
      />
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

      {/* Share Button */}
      <button
        onClick={() => setShareModalOpen(true)}
        className={`fixed top-6 right-6 z-40 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors
          ${theme === "rgb(24,24,27)" 
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-indigo-600 text-white hover:bg-indigo-700"}
        `}
        title="Share & Collaborate"
      >
        <Share2 size={18} />
        Share
      </button>
      {sidebarVisible && (
        <Sidebar
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedStrokeWidth={selectedStrokeWidth}
          setSelectedStrokeWidth={setSelectedStrokeWidth}
          onClose={() => setSidebarVisible(false)}
        />
      )}
      {/* Zoom Controls */}
      <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm font-mono shadow-lg
        ${theme === "rgb(24,24,27)" ? "bg-zinc-800 text-white border border-zinc-700" : "bg-white text-gray-800 border border-gray-200"}
      `}>
        <button
          onClick={() => game?.zoomOut()}
          className={`w-6 h-6 flex items-center justify-center rounded hover:bg-opacity-80 transition-colors
            ${theme === "rgb(24,24,27)" ? "hover:bg-zinc-700" : "hover:bg-gray-100"}
          `}
          title="Zoom out"
        >
          -
        </button>
        <span className="px-2 min-w-[40px] text-center">
          {zoomPercentage}%
        </span>
        <button
          onClick={() => game?.zoomIn()}
          className={`w-6 h-6 flex items-center justify-center rounded hover:bg-opacity-80 transition-colors
            ${theme === "rgb(24,24,27)" ? "hover:bg-zinc-700" : "hover:bg-gray-100"}
          `}
          title="Zoom in"
        >
          +
        </button>
      </div>
      
      {/* Undo/Redo Controls */}
      <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1.5 rounded-lg shadow-lg
        ${theme === "rgb(24,24,27)" ? "bg-zinc-800 text-white border border-zinc-700" : "bg-white text-gray-800 border border-gray-200"}
      `}>
        <button
          onClick={() => game?.undo()}
          disabled={!canUndo}
          className={`w-8 h-8 flex items-center justify-center rounded transition-all
            ${canUndo 
              ? (theme === "rgb(24,24,27)" ? "hover:bg-zinc-700 text-white" : "hover:bg-gray-100 text-gray-800")
              : "opacity-40 cursor-not-allowed"
            }
          `}
          title="Undo (Ctrl+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6"/>
            <path d="m21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
          </svg>
        </button>
        <button
          onClick={() => game?.redo()}
          disabled={!canRedo}
          className={`w-8 h-8 flex items-center justify-center rounded transition-all
            ${canRedo 
              ? (theme === "rgb(24,24,27)" ? "hover:bg-zinc-700 text-white" : "hover:bg-gray-100 text-gray-800")
              : "opacity-40 cursor-not-allowed"
            }
          `}
          title="Redo (Ctrl+Y)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6"/>
            <path d="m3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/>
          </svg>
        </button>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal roomId={roomId} onClose={() => setShareModalOpen(false)} />
      )}
    </div>
  );
}