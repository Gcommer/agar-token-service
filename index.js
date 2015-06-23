#!/usr/bin/env node

require('dotenv').load()

var express = require('express');
var app = express();

app.get('/status', function (req, res) {
  res.send("Status API");
});

app.use('/', express.static("static"));

console.log("Listening on: " + process.env.PORT);
app.listen(process.env.PORT);
