import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { db } from "@repo/db/index";

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

const wss = new WebSocketServer({ port: 8080 });

const checkUser = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded == "string") {
      return null;
    }

    if (!decoded || !decoded.userId) {
      return null;
    }

    return decoded.userId;
  } catch (e) {
    console.log(e);
  }
  return null;
};

wss.on("connection", function connection(ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = checkUser(token);

  if (!userId) {
    ws.close();
    return;
  }

  const user: User = {
    userId,
    rooms: [],
    ws,
  };

  users.push(user);

  ws.on("message", async function message(data) {
    const parsedData = JSON.parse(data as unknown as string);

    if (parsedData.type === "join_room") {
      const user = users.find((user) => user.ws === ws);
      if (user) {
        user.rooms.push(parsedData.roomId);
      }
    }

    if (parsedData.type === "leave_room") {
      const user = users.find((user) => user.ws === ws);
      if (user) {
        user.rooms = user.rooms.filter((room) => room !== parsedData.roomId);
      }
    }



    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      // console.log("Received chat message:", { roomId, message });
      // console.log("Current users:", users);

      await db.chat.create({
        data: {
          message,
          userId,
          roomId
        }
      })

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          if (user.ws.readyState === WebSocket.OPEN) {
            console.log(user.ws.readyState === WebSocket.OPEN, "line 88")
            try {
              user.ws.send(
                JSON.stringify({
                  type: "chat",
                  message: message,
                  roomId
                })
              );
            } catch (error) {
              console.error("Error sending message:", error);
            }
          } else {
            console.warn("WebSocket connection is not open:", user.ws.readyState);
          }
        }
      });
    }
  });

  ws.on("close", () => {
    const userIndex = users.findIndex((user) => user.ws === ws);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
    }
  });
});