import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { db } from "@repo/db/index";
import { shapeSchema } from "@repo/common/types";
import http from 'http';

// Logger utility
const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[WS-INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[WS-ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WS-WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  }
};

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];
const PORT = process.env.PORT || 8081;
const HTTP_URL = process.env.HTTP_URL || "http://localhost:5050"

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connections: users.length,
      environment: process.env.NODE_ENV || 'development'
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const wss = new WebSocketServer({ 
  server,
  perMessageDeflate: false, // Disable compression for better performance
});

// Helper function to validate if a session is still active
const validateSessionUser = async (userId: string): Promise<boolean> => {
  if (!userId.startsWith("session_")) {
    return true; // Token-based users are always valid once connected
  }
  
  const sessionKey = userId.replace("session_", "");
  try {
    const session = await db.session.findUnique({
      where: { sessionKey, isActive: true }
    });
    return !!session;
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
};



const checkUser = (token: string): string | null => {
  if (!token) {
    return null;
  }

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

wss.on("connection", async function connection(ws, request) {
  const url = request.url;
  if (!url) {
    ws.close(1008, "URL required");
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const sessionKey = queryParams.get("sessionKey");
  const token = queryParams.get("token");

  // Option 1: Session-based connection (for shared sessions)
  if (sessionKey) {
    try {
      // Validate session key
      const session = await db.session.findUnique({
        where: { sessionKey, isActive: true },
        include: { room: true }
      });

      if (!session) {
        ws.close(1008, "Invalid or inactive session");
        return;
      }

      // Create user object for session-based connection
      const user: User = {
        userId: `session_${sessionKey}`, // Temporary user ID for session users
        rooms: [session.roomId.toString()],
        ws,
      };

      users.push(user);
      logger.info(`User joined via session`, { sessionKey, roomId: session.roomId, totalUsers: users.length });

    } catch (error) {
      logger.error("Session validation error:", error);
      ws.close(1008, "Session validation failed");
      return;
    }
  }
  // Option 2: Token-based connection (for room owners)
  else if (token) {
    const userId = checkUser(token);

    if (!userId) {
      ws.close(1008, "Invalid token");
      return;
    }

    const user: User = {
      userId,
      rooms: [],
      ws,
    };

    users.push(user);
    logger.info(`Room owner connected`, { userId, totalUsers: users.length });
  }
  // Option 3: No valid auth
  else {
    ws.close(1008, "Session key or token required");
    return;
  }

  ws.on("message", async function message(data) {
    try {
      const parsedData = JSON.parse(data as unknown as string);

      // Find the current user
      const currentUser = users.find(user => user.ws === ws);
      if (!currentUser) {
        ws.close(1008, "User not found");
        return;
      }

      // Validate session is still active for session-based users
      const isValidSession = await validateSessionUser(currentUser.userId);
      if (!isValidSession) {
        logger.warn(`Session expired for user`, { userId: currentUser.userId });
        ws.close(1008, "Session has ended");
        // Remove user from users array
        const userIndex = users.indexOf(currentUser);
        if (userIndex > -1) {
          users.splice(userIndex, 1);
        }
        return;
      }

      /* Joining the room */
      try {
        if (parsedData.MESSAGE_TYPE === "join_room") {
          const user = users.find((user) => user.ws === ws);
          if (user) {
            // Only allow token-based users (room owners) to join rooms manually
            // Session-based users are already joined to their specific room
            if (!user.userId.startsWith("session_")) {
              user.rooms.push(parsedData.roomId);
            }
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
        // Handle shape deletion
        if (parsedData.MESSAGE_TYPE === "delete_shape") {
          const shapeId = parsedData.shapeId;
          const roomId = parsedData.roomId;
          if (!shapeId || !roomId) return;
          try {
            try {
              const response = await require('axios').default.delete(`${HTTP_URL}/shapes/${Number(shapeId)}`);
              console.log(`Shape ${shapeId} deleted from DB. Response:`, response.data);
            } catch (err) {
              console.error("Failed to delete shape from DB", (err as any)?.response?.data || err);
              return;
            }
          } catch (err) {
            console.error("Failed to delete shape from DB", err);
            return;
          }
          // Broadcast deletion to all clients in the room
          users.forEach((user) => {
            if (user.rooms.includes(roomId)) {
              try {
                user.ws.send(
                  JSON.stringify({
                    MESSAGE_TYPE: "delete_shape",
                    shapeId,
                    roomId,
                  })
                );
              } catch (e) {
                console.log("error sending shape deletion", e);
              }
            }
          });
          return;
        }

        // Handle eraser (bulk delete)
        if (parsedData.MESSAGE_TYPE === "erase" && parsedData.shapeIds) {
          // Broadcast erase event to all clients in the room
          console.log("Erasing shapes with IDs:", parsedData.shapeIds);
          users.forEach(user => {
            if (user.rooms.includes(parsedData.roomId)) {
              user.ws.send(JSON.stringify({
                MESSAGE_TYPE: "erase",
                shapeIds: parsedData.shapeIds,
                roomId: parsedData.roomId,
              }));
            }
          });
        
          // Delete shapes from the database
          try {
            await db.shape.deleteMany({
              where: {
                id: { in: parsedData.shapeIds },
                roomId: parsedData.roomId
              }
            });
          } catch (error) {
            console.error("Error deleting shapes from database:", error);
          }
        }

        // Handle clear all canvas
        if (parsedData.MESSAGE_TYPE === "clear_all") {
          console.log("Clearing all shapes for room:", parsedData.roomId);
          
          // Delete all shapes from database for this room
          try {
            await db.shape.deleteMany({
              where: { roomId: parsedData.roomId }
            });
            console.log("All shapes deleted from database for room:", parsedData.roomId);
          } catch (error) {
            console.error("Error deleting shapes from database:", error);
          }
          
          // Broadcast clear_all event to all clients in the room
          users.forEach(user => {
            if (user.rooms.includes(parsedData.roomId)) {
              try {
                user.ws.send(JSON.stringify({
                  MESSAGE_TYPE: "clear_all",
                  roomId: parsedData.roomId,
                }));
              } catch (e) {
                console.log("Error sending clear_all message:", e);
              }
            }
          });
        }

        if (parsedData.MESSAGE_TYPE === "shape") {
          // console.log("control reaching here")
          // console.log(parsedData.shape)
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
              ...(shape.radius !== undefined && {radius: shape.radius}),
              ...(shape.radiusX !== undefined && {radiusX: shape.radiusX}),
              ...(shape.radiusY !== undefined && {radiusY: shape.radiusY}),
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
              font: shape.font,
              fontSize: shape.fontSize,
              color: shape.color
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
                // Include tempId if it exists (for matching local shapes)
                const shapeToSend = (parsedData.shape as any)._tempId 
                  ? { ...newShape, _tempId: (parsedData.shape as any)._tempId }
                  : newShape;
                  
                user.ws.send(
                  JSON.stringify({
                    MESSAGE_TYPE: "shape",
                    shape: shapeToSend,
                    roomId,
                  })
                );
              } catch (e) {
                console.log("error sending shape", e);
              }
            }
          });
        }
        
        // Handle shape updates (for resize/move operations)
        if (parsedData.MESSAGE_TYPE === "update_shape") {
          const shape = parsedData.shape;
          const roomId = parsedData.roomId;
          
          if (!shape || !shape.id || !roomId) {
            console.error("Invalid update_shape message:", parsedData);
            return;
          }
          
          try {
            // Update the shape in the database
            const updatedShape = await db.shape.update({
              where: { id: shape.id },
              data: {
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height,
                centerX: shape.centerX,
                centerY: shape.centerY,
                radiusX: shape.radiusX,
                radiusY: shape.radiusY,
                x1: shape.x1,
                y1: shape.y1,
                x2: shape.x2,
                y2: shape.y2,
                fontSize: shape.fontSize,
                content: shape.content,
                points: shape.points ? JSON.stringify(shape.points) : undefined
              }
            });
            
            if (updatedShape) {
              console.log("Shape updated:", updatedShape.id);
              
              // Broadcast the updated shape to all users in the room
              users.forEach((user) => {
                if (user.rooms.includes(roomId)) {
                  try {
                    user.ws.send(
                      JSON.stringify({
                        MESSAGE_TYPE: "shape_updated",
                        shape: updatedShape,
                        roomId,
                      })
                    );
                  } catch (e) {
                    console.log("Error sending shape update", e);
                  }
                }
              });
            }
          } catch (error) {
            console.error("Error updating shape:", error);
          }
        }
      } catch (e) {
        console.log("Error creating and sending shape", e);
      }
    } catch (e) {
      console.log("Error processing message:", e);
    }
  });

  ws.on("close", (code, reason) => {
    logger.info(`WebSocket connection closed`, { code, reason: reason?.toString() });
    const userIndex = users.findIndex((user) => user.ws === ws);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
    }
  });

  // Handle connection errors
  ws.on('error', (error) => {
    logger.error("WebSocket connection error:", error);
  });
});

// Start the server
server.listen(PORT, () => {
  logger.info(`WebSocket server listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check available at: http://localhost:${PORT}/health`);
});
