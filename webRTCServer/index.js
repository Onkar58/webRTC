const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const fs = require("fs");
const https = require("https");

const port = 8001;

const SDP_OBJECTS = {};

app.use(bodyParser.json());
app.use(cors());

app.post("/postoffer", (req, res) => {
  console.log("Storing Offer", req.body.offer);
  const key = crypto.hash("sha256", JSON.stringify(req.body.offer));
  SDP_OBJECTS[key] = { offer: req.body.offer, userId: req.body.userId };
  res.send({ url: key });
});

app.post("/:url/postanswer", (req, res) => {
  console.log("storing answer");
  const url = req.params.url;
  const { answer } = req.body;
  console.log("answer", answer);
  SDP_OBJECTS[url]["answer"] = answer;
  res.send({ message: "answer set" });
});

app.get("/:url/getoffer", (req, res) => {
  console.log("getting offer");
  const url = req.params.url;
  console.log(url);
  console.log(SDP_OBJECTS);
  res.send(SDP_OBJECTS[url].offer);
});

app.get("/:url/getanswer", (req, res) => {
  console.log("getting answer");
  const url = req.params.url;
  console.log(SDP_OBJECTS[url]);
  res.send(SDP_OBJECTS[url]?.answer);
});

app.get("/", (req, res) => {
  res.send("Hello");
});

// var privateKey = fs.readFileSync("192.168.1.19-key.pem");
// var certificate = fs.readFileSync("192.168.1.19.pem");

https
  .createServer(
    // {
    //   key: privateKey,
    //   cert: certificate,
    // },
    app,
  )
  .listen(port);
