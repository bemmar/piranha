import express, { Application } from 'express';
import bodyParser from 'body-parser'

console.log(process.env.AUTH_PAYLOAD);

const app: Application = express();

app.use(bodyParser.json());

app.get("*", (req, res) => {
    console.log("get", req.url, req.body);

    res.sendStatus(200);
})

app.post("*", (req, res) => {
    console.log("post", req.url, req.body);

    res.sendStatus(200);
});

app.listen(process.env.PORT);