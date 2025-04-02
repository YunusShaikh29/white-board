"use client";

import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";
// import { Tool } from "./Tools";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyOThiNjNkNi0yZWZlLTQ5M2QtODEzYy0xZGU3YTNkYzNlMTUiLCJpYXQiOjE3NDM1ODA5ODUsImV4cCI6MTc0Mzg0MDE4NX0.AwTq6O2tNtGm_QXb2pCt6dYFxAPzC_5WLzGLr0Y7cyM`
    );

    ws.onopen = () => {
      setSocket(ws);
      ws.send(
        JSON.stringify({
          MESSAGE_TYPE: "join_room",
          roomId,
        })
      );
    };

    return () => {
      ws.onclose = () => {
        ws.close();
      };
    };
  }, [roomId]);

  if (!socket) {
    return (
      <div className="flex justify-center items-center text-4xl text-black bg-transparent text-secondary">
        Connecting to server...
      </div>
    );
  }

  return (
    <>
    <Canvas roomId={roomId} socket={socket} />;
    </>
  )
  
}
