import express from 'express'

const app = express()

app.get("/healthy-server", (req, res) => {
    res.json({"message": "healthy server"})
})

app.listen(3001, () => {
    console.log("http server running")
})