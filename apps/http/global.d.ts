import "express";

declare global {
    namespace Express {
        interface Request {
            userId?: string; // Or `number` based on your userId type
        }
    }
}
