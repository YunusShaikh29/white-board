import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken"
import {JWT_SECRET} from "@repo/backend-common/config"


interface AuthTokenPayload extends JwtPayload {
    userId: string
}


export function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers["authorization"]?.split(" ")[1] ?? ""

    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload

    try {

        if(decoded){
            req.userId = decoded.userId
            next()
        }else {
            res.status(403).json({
                message: "Unauthorized"
            })
        }
    }catch (error) {
        res.status(403).json({
            message: "Unauthorized",
        });
    }
}