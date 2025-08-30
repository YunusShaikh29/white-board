/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";
import { getStoredToken } from "../services/auth";
import { useRouter, useSearchParams } from "next/navigation";

export default function RoomCanvas({ roomId }: { roomId: number }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionType, setConnectionType] = useState<'owner' | 'session'>('owner');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionKey = searchParams.get('sessionKey');
    let cleanup: (() => void) | undefined;
    
    if (sessionKey) {
      setConnectionType('session');
      cleanup = setupSessionConnection(sessionKey);
    } else {
      setConnectionType('owner');
      cleanup = setupOwnerConnection();
    }

    return cleanup;
  }, [roomId, searchParams]);

  const setupOwnerConnection = () => {
    const token = getStoredToken();
    if (!token) {
      router.push('/signin');
      return;
    }
    
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}`
    );

    return setupWebSocketHandlers(ws, 'owner');
  };

  const setupSessionConnection = (sessionKey: string) => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}?sessionKey=${sessionKey}`
    );

    return setupWebSocketHandlers(ws, 'session');
  };

  const setupWebSocketHandlers = (ws: WebSocket, type: 'owner' | 'session') => {
    ws.onopen = () => {
      // console.log(`WebSocket connected as ${type}`);
      setSocket(ws);
      
      // Only send join_room for owner connections
      // Session connections are automatically joined to their room
      if (type === 'owner') {
        ws.send(
          JSON.stringify({
            MESSAGE_TYPE: "join_room",
            roomId,
          })
        );
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.warn("WebSocket connection closed:", event.code, event.reason);
      setSocket(null);
      
      // If session connection was closed due to session ending, redirect
      if (type === 'session' && event.code === 1008) {
        alert("The collaboration session has ended.");
        router.push('/rooms');
      }
    };

    const cleanup = () => {
      if (ws.readyState === WebSocket.OPEN) {
        if (type === 'owner') {
          ws.send(
            JSON.stringify({
              MESSAGE_TYPE: "leave_room",
              roomId,
            })
          );
        }
        ws.close();
      }
    };

    return cleanup;
  };

  if (!socket) {
    return (
      <div className="w-screen h-screen flex justify-center items-center text-4xl text-black bg-transparent text-secondary">
        Connecting to server...
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      <Canvas roomId={roomId} socket={socket} />
    </div>
  );
}
