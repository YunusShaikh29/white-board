// LivePreview.js
import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

const LivePreview = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushColor, setBrushColor] = useState('black');
  const [brushWidth, setBrushWidth] = useState(5);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current || "", {
      isDrawingMode: true,
    });

    const updateBrush = () => {
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushWidth;
      }
    };

    updateBrush();

    return () => {
      canvas.dispose();
    };
  }, [brushColor, brushWidth]);

  return (
    <div className="bg-gray-700 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
      <canvas id="live-preview-canvas" ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <div className="absolute bottom-0 left-0 p-4 flex space-x-2">
        <button
          className={`w-8 h-8 rounded-full border-2 border-gray-500 ${brushColor === 'black' ? 'border-blue-500' : ''}`}
          onClick={() => setBrushColor('black')}
        />
        <button
          className={`w-8 h-8 rounded-full border-2 border-gray-500 ${brushColor === 'red' ? 'border-blue-500' : ''}`}
          onClick={() => setBrushColor('red')}
        />
        <button
          className={`w-8 h-8 rounded-full border-2 border-gray-500 ${brushColor === 'blue' ? 'border-blue-500' : ''}`}
          onClick={() => setBrushColor('blue')}
        />
        <button
          className={`w-8 h-8 rounded-full border-2 border-gray-500 ${brushColor === 'green' ? 'border-blue-500' : ''}`}
          onClick={() => setBrushColor('green')}
        />
      </div>
      <div className="absolute bottom-0 right-0 p-4 flex space-x-2">
        <button
          className={`w-8 h-8 rounded-full border-2 border-gray-500 ${brushWidth === 3 ? 'border-blue-500' : ''}`}
          onClick={() => setBrushWidth(3)}
        />
        <button
          className={`w-8 h-8 rounded-full border-2 border-gray-500 ${brushWidth === 5 ? 'border-blue-500' : ''}`}
          onClick={() => setBrushWidth(5)}
        />
        <button
          className={`w-8 h-8 rounded-full border-2 border-gray-500 ${brushWidth === 7 ? 'border-blue-500' : ''}`}
          onClick={() => setBrushWidth(7)}
        />
      </div>
    </div>
  );
};

export default LivePreview;