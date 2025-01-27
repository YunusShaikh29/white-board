import express from 'express'
import { middleware } from './middleware'
import jwt from "jsonwebtoken"

const app = express()

const JWT_SECRET = process.env.JWT_SECRET || ""

app.post("/signup", (req, res) => {
    res.json({
        userId: "123"
    })
})

app.post("/signin", (req, res) => {

    const userId = '123'
    const token = jwt.sign({
        userId
    }, JWT_SECRET)

    res.json({token})
})

app.post("/room", middleware, (req, res) => {
    res.json({
        roomId: 123
    })
})

app.listen(3001, () => {
    console.log("http server running")
})