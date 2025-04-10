"use client";

import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyOThiNjNkNi0yZWZlLTQ5M2QtODEzYy0xZGU3YTNkYzNlMTUiLCJpYXQiOjE3NDM3OTY3NTUsImV4cCI6MTc0NDA1NTk1NX0.W7JN6Ag7C93jKny07UIsCL2d1eKfk03viOGVq5A3lEc`);

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
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            MESSAGE_TYPE: "leave_room",
            roomId,
          })
        );
      }

      ws.onclose = () => {
        // Handle any additional cleanup if needed
      };

      ws.close();
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
  );
}
