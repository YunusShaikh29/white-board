import { Color, colors, Theme } from "@/util/type";
import { useState } from "react";
import { Moon, Sun, X } from "lucide-react";

interface SidebarProps {
  selectedColor: Color;
  setSelectedColor: (c: Color) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  onClose: () => void;
}

export function Sidebar({
  selectedColor,
  setSelectedColor,
  theme,
  setTheme,
  onClose,
}: SidebarProps) {
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
    <div className={`fixed top-0 right-0 h-full w-64 shadow-lg z-50 transform transition-transform duration-300 ${
      theme === "rgb(24,24,27)" ? "bg-zinc-800" : "bg-white"
    }`}>
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
      <div className="p-4 space-y-6">
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
        <div>
          <p className={`text-sm font-medium ${
            theme === "rgb(24,24,27)" ? "text-gray-300" : "text-gray-700"
          }`}>Theme</p>
          <div className="flex gap-4 mt-2">
            <button
              className={`flex items-center gap-1 px-3 py-2 rounded-md border ${
                theme === "rgb(255,255,255)"
                  ? "bg-indigo-500 text-white border-transparent"
                  : theme === "rgb(24,24,27)" 
                    ? "bg-zinc-800 text-gray-300 border-zinc-600"
                    : "bg-white text-gray-700 border-gray-300"
              }`}
              onClick={() => setTheme("rgb(255,255,255)")}
              title="Light"
            >
              <Sun size={16} />
              Light
            </button>
            <button
              className={`flex items-center gap-1 px-3 py-2 rounded-md border ${
                theme === "rgb(24,24,27)"
                  ? "bg-indigo-500 text-white border-transparent"
                  : theme === "rgb(24,24,27)"
                    ? "bg-zinc-800 text-gray-300 border-zinc-600"
                    : "bg-white text-gray-700 border-gray-300"
              }`}
              onClick={() => setTheme("rgb(24,24,27)")}
              title="Dark"
            >
              <Moon size={16} />
              Dark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}