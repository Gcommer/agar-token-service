#!/usr/bin/env node

require('dotenv').load()

var express = require('express');
var app = express();

var tokens = {};
var token_counts = {};
var killFlag = false;

function isValidURL(url) {
  var parts = url.split(':');
  if (parts.length !== 2) {
    return false;
  }

  var ip = parts[0].split('.');
  var port = parseInt(parts[1], 10);

  if (ip.length !== 4 || port < 1 || port > 65535) {
    return false;
  }

  return ip.every(function (x) { return x > -1 && x < 256; });
}

app.get('/status', function (req, res) {
  if (killFlag) {
    res.send({ msg: 'KILLED' });
    return;
  }

  res.send({ msg: 'status', status: token_counts });
});

app.get('/donate', function (req, res) {
  if (killFlag) {
    res.send({ msg: 'KILLED' });
    return;
  }

  var server = req.query.server;
  var token = req.query.token;

  if (!isValidURL(server)) {
    res.send({ msg: 'invalid_url' });
    return;
  }

  if (typeof token !== 'string' || token.length === 0) {
    res.send({ msg: 'invalid_token' });
    return;
  }

  if (tokens.hasOwnProperty(server)) {
    tokens[server].push(token);
    token_counts[server] += 1;
  } else {
    tokens[server] = [token];
    token_counts[server] = 1;
  }

  res.send({ msg: 'thank_you' });
});

app.get('/claim', function (req, res) {
  if (killFlag) {
    res.send({ msg: 'KILLED' });
    return;
  }

  var server = req.query.server;
  if (tokens.hasOwnProperty(server) &&
      tokens[server].length > 0) {
    var token = tokens[server].shift();
    token_counts[server] -= 1;
    res.send({ msg: 'available',
               token: token });
  } else {
    res.send({ msg: 'unavailable' });
  }
});

app.use('/', express.static('static'));

console.log('Listening on: ' + process.env.PORT);
app.listen(process.env.PORT);
