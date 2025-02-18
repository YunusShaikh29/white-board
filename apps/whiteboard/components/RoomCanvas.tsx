"use client";

import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyOThiNjNkNi0yZWZlLTQ5M2QtODEzYy0xZGU3YTNkYzNlMTUiLCJpYXQiOjE3Mzk5MDkwNzEsImV4cCI6MTc0MDE2ODI3MX0.uixOdwPiuCdJu_E6WhPABsZumCnzn1dlSeiyV-3zyXY`
    );

    ws.onopen = () => {
      setSocket(ws);
      ws.send(
        JSON.stringify({
          type: "join_room",
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
      <div className="flex justify-center items-center text-4xl bg-transparent text-secondary">
        Connecting to server...
      </div>
    );
  }

  return <Canvas roomId={roomId} socket={socket} />;
}
