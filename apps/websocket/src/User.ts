import WebSocket from "ws"

interface User {
  ws: WebSocket
  rooms: string[]
  userId: string
}

export const users: User[] = []