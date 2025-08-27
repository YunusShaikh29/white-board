import { Color, colors, StrokeWidth } from "@/util/type";
import { useState } from "react";
import { X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface SidebarProps {
  selectedColor: Color;
  setSelectedColor: (c: Color) => void;
  selectedStrokeWidth: StrokeWidth;
  setSelectedStrokeWidth: (w: StrokeWidth) => void;
  onClose: () => void;
}

export function Sidebar({
  selectedColor,
  setSelectedColor,
  selectedStrokeWidth,
  setSelectedStrokeWidth,
  onClose,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const [showDropDown, setShowDropDown] = useState(false);

  const handleColorSelect = (color: Color) => {
    // Adjust color based on theme
    if (theme === "rgb(24,24,27)" && (color === "#000000" || color === "#7a7a7a")) {
      setSelectedColor("#ffffff");
    } else if (theme === "rgb(255,255,255)" && color === "#ffffff") {
      setSelectedColor("#000000");
    } else {
      setSelectedColor(color);
    }
    setShowDropDown(false);
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-[280px] shadow-lg z-50 transform transition-all duration-300 ${
      theme === "rgb(24,24,27)" ? "bg-zinc-900/95 backdrop-blur-sm" : "bg-white/95 backdrop-blur-sm"
    } border-l ${theme === "rgb(24,24,27)" ? "border-zinc-800" : "border-gray-200"}`}>
      <div className={`flex justify-between items-center p-4 border-b ${
        theme === "rgb(24,24,27)" ? "border-zinc-700" : "border-gray-200"
      }`}>
        <h2 className={`text-lg font-semibold ${
          theme === "rgb(24,24,27)" ? "text-gray-100" : "text-gray-800"
        }`}>Settings</h2>
        <button onClick={onClose} className={
          theme === "rgb(24,24,27)" ? "text-gray-300 hover:text-gray-100" : "text-gray-600 hover:text-gray-900"
        }>
          <X size={20} />
        </button>
      </div>
      <div className="p-6 space-y-8 flex-1 overflow-y-auto">
        <div>
          <p className={`text-sm font-medium ${
            theme === "rgb(24,24,27)" ? "text-gray-300" : "text-gray-700"
          }`}>Select Color</p>
          <button
            className={`w-full h-10 rounded-md mt-2 border ${
              theme === "rgb(24,24,27)" ? "border-zinc-600" : "border-gray-300"
            }`}
            style={{ backgroundColor: selectedColor }}
            onClick={() => setShowDropDown((prev) => !prev)}
          ></button>
          {showDropDown && (
            <div className={`mt-2 p-2 rounded-md shadow-sm border ${
              theme === "rgb(24,24,27)" 
                ? "bg-zinc-700 border-zinc-600" 
                : "bg-white border-gray-300"
            }`}>
              <ul className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <li
                    key={color}
                    className={`w-8 h-8 rounded cursor-pointer border ${
                      theme === "rgb(24,24,27)" ? "border-zinc-600" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                  ></li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Stroke Width Control */}
        <div>
          <p className={`text-sm font-medium mb-3 ${
            theme === "rgb(24,24,27)" ? "text-gray-300" : "text-gray-700"
          }`}>Stroke Width</p>
          <div className="grid grid-cols-4 gap-2">
            {([1, 5, 10, 15, 20] as StrokeWidth[]).map((width) => (
              <button
                key={width}
                onClick={() => setSelectedStrokeWidth(width)}
                className={`h-8 rounded-md border transition-all ${
                  selectedStrokeWidth === width
                    ? theme === "rgb(24,24,27)"
                      ? "border-indigo-400 bg-indigo-600/20"
                      : "border-indigo-500 bg-indigo-50"
                    : theme === "rgb(24,24,27)"
                      ? "border-zinc-600 hover:border-zinc-500"
                      : "border-gray-300 hover:border-gray-400"
                }`}
                title={`${width}px stroke`}
              >
                <div 
                  className={`w-full rounded ${
                    theme === "rgb(24,24,27)" ? "bg-gray-300" : "bg-gray-700"
                  }`}
                  style={{ height: `${Math.min(width, 4)}px` }}
                />
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <p className={`text-sm font-medium ${
            theme === "rgb(24,24,27)" ? "text-gray-300" : "text-gray-700"
          }`}>Theme</p>
          <div className="flex gap-4 mt-2">
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${theme === "rgb(255,255,255)" ? "bg-indigo-500 text-white border-transparent" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === "rgb(24,24,27)" ? (
                <>
                  <Sun size={16} />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon size={16} />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Navigation and Logout controls */}
      <div className={`p-6 border-t ${
        theme === "rgb(24,24,27)" ? "border-zinc-800 bg-zinc-900/95" : "border-gray-100 bg-white/95"
      } backdrop-blur-sm space-y-3`}>
        <button
          onClick={() => window.location.href = '/rooms'}
          className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
            theme === "rgb(24,24,27)" 
              ? "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 hover:border-gray-300"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Dashboard
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('jwt_token');
            window.location.href = '/signin';
          }}
          className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
            theme === "rgb(24,24,27)" 
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30"
              : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 hover:border-red-200"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </div>
    </div>
  );
}