import {create} from "zustand"

interface TextStyleState {
    font: string
    fontSize: number
    color: string
    setFont: (font: string) => void
    setFontSize: (fontSize: number) => void
    setColor: (color: string) => void
}

const useTextStyleStore = create<TextStyleState>((set) => ({
    font: "Arial",
    fontSize: 16,
    color: "#000000",
    setFont: (font) => set({font}),
    setFontSize: (fontSize) => set({fontSize: fontSize}),
    setColor: (color) => set({color})
}))

export default useTextStyleStore