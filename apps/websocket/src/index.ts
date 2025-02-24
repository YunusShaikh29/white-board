import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { db } from "@repo/db/index";
import { shapeSchema } from "@repo/common/types";

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

const wss = new WebSocketServer({ port: 8081 });

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
    try {
      const parsedData = JSON.parse(data as unknown as string);

      /* Joining the room */
      try {
        if (parsedData.MESSAGE_TYPE === "join_room") {
          const user = users.find((user) => user.ws === ws);
          if (user) {
            user.rooms.push(parsedData.roomId);
          }
        }
      } catch (e) {
        console.log(e);
      }

      /* Leaving the room */
      try {
        if (parsedData.MESSAGE_TYPE === "leave_room") {
          const user = users.find((user) => user.ws === ws);
          if (user) {
            user.rooms = user.rooms.filter(
              (room) => room !== parsedData.roomId
            );
          }
        }
      } catch (e) {
        console.log(e);
      }


      /* Shapes */
      try {
        if (parsedData.MESSAGE_TYPE === "shape") {
          console.log("control reaching here")
          console.log(parsedData.shape)
          const validatedResult = shapeSchema.safeParse(parsedData.shape);
          if (!validatedResult.success) {
            console.error("Shape validation failed", validatedResult.error);
            return;
          }

          const shape = validatedResult.data;
          const roomId = parsedData.roomId;

          let shapeData: any = {
            type: shape.type,
            roomId: +roomId,
          };

          if (shape.type === "rect" || shape.type === "rhombus") {
            shapeData = {
              ...shapeData,
              x: shape.x,
              y: shape.y,
              width: shape.width,
              height: shape.height,
            };
          } else if (shape.type === "circle") {
            shapeData = {
              ...shapeData,
              centerX: shape.centerX,
              centerY: shape.centerY,
              radius: shape.radius,
            };
          } else if (shape.type === "arrow" || shape.type === "line") {
            shapeData = {
              ...shapeData,
              x1: shape.x1,
              x2: shape.x2,
              y1: shape.y1,
              y2: shape.y2,
            };
          } else if (shape.type === "pencil") {
            shapeData = {
              ...shapeData,
              points: shape.points,
            };
          } else if (shape.type === "text") {
            shapeData = {
              ...shapeData,
              x: shape.x,
              y: shape.y,
              content: shape.content,
            };
          }

          const newShape = await db.shape.create({
            data: shapeData,
          });
          if (!newShape) return;

          /* Broadcasting shapes to everyone */
          users.forEach((user) => {
            if (user.rooms.includes(roomId)) {
              try {
                user.ws.send(
                  JSON.stringify({
                    MESSAGE_TYPE: "shape",
                    shape: newShape,
                    roomId,
                  })
                );
              } catch (e) {
                console.log("error sending shape", e);
              }
            }
          });
        }
      } catch (e) {
        console.log("Error creating and sending shape", e);
      }
    } catch (e) {
      console.log("Error processing message:", e);
    }
  });

  ws.on("close", () => {
    const userIndex = users.findIndex((user) => user.ws === ws);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
    }
  });
});
