import * as express from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string; // Use `string` if your userId is a UUID, or `number` if it's an integer
    }
  }
}
