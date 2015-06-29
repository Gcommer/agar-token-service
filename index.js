#!/usr/bin/env node

require('dotenv').load()

var express = require('express');
var app = express();

var tokens = {};
var token_counts = {};

var killFlag = false;
var TICKET_EXPIRE_MS = 12 * 1000;

// The second param to "".split is useless, so this just
function strSingleSplit(str, sep) {
  var i = str.indexOf(sep);
  return [str.slice(0, i), str.slice(i + 1)];
}

// Yes express.js parses the query string for us, but we need the raw
// string without replacing '+' -> ' '
//
// just doing a .replace after the fact runs the risk of literal
// spaces being dumped if they get added
function rawQueryStringParse(url) {
  // chop off the first ? and backwards
  var queryString = strSingleSplit(unescape(url), '?')[1];

  return queryString.split('&').map(function (kv) {
    return strSingleSplit(kv, '=');
  }).reduce(function (acc, cur) {
    acc[cur[0]] = cur[1];
    return acc;
  }, {});
}

// milliseconds since the UNIX epoch (UTC)
function time() {
  var now = new Date();
  var utc = new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  ));
  return +utc;
}

function isValidURL(url) {
  // Cut off the proto
  var slashslash = url.indexOf('//');
  if (slashslash !== -1) {
    url = url.slice(slashslash + 2);
  }

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

  var status;
  if (!req.query.hasOwnProperty("all")) {
    status = {};
    Object.keys(token_counts).forEach(function (url) {
      if (token_counts[url] > 0) {
        status[url] = token_counts[url];
      }
    });
  } else {
    status = token_counts;
  }

  res.send({ msg: 'status',
             status: status });
});

app.get('/donate', function (req, res) {
  if (killFlag) {
    res.send({ msg: 'KILLED' });
    return;
  }

  if (!req.query.hasOwnProperty('server')) {
    res.send({ msg: 'invalid_url' });
    return;
  }

  if (!req.query.hasOwnProperty('token')) {
    res.send({ msg: 'invalid_token' });
    return;
  }

  var server = req.query.server;

  var token = rawQueryStringParse(req.url).token;

  if (!isValidURL(server)) {
    res.send({ msg: 'invalid_url' });
    return;
  }

  if (typeof token !== 'string' || token.length === 0) {
    res.send({ msg: 'invalid_token' });
    return;
  }

  var timeout = TICKET_EXPIRE_MS;
  if (req.query.timeout) {
    timeout = parseInt(req.query.timeout, 10);
  }

  var t = time();
  token_obj = {
    time: t,
    timeout: t + timeout,
    token: token
  };

  if (tokens.hasOwnProperty(server)) {
    tokens[server].push(token_obj);
    token_counts[server] += 1;
  } else {
    tokens[server] = [token_obj];
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

  if (typeof server !== 'string' || !isValidURL(server)) {
    res.send({ msg: 'invalid_url' });
    return;
  }

  if (!tokens.hasOwnProperty(server)) {
    res.send({ msg: 'unavailable' });
    return;
  }

  expireTokens(server);

  if (tokens[server].length === 0) {
    res.send({ msg: 'unavailable' });
    return;
  }

  var token_obj = tokens[server].shift();
  token_counts[server] -= 1;
  res.send({ msg: 'available',
             token: token_obj.token,
             time: token_obj.time,
             timeout: token_obj.timeout});
});

setInterval(function () {
  Object.keys(tokens).forEach(expireTokens);
}, 1000);

function expireTokens(url) {
  var now = time();
  var arr = tokens[url];
  while (arr.length > 0 && arr[0].timeout <= now) {
    token_counts[url] -= 1;
    arr.shift();
  }
}

app.use('/', express.static('static'));

console.log('Listening on: ' + process.env.PORT);
app.listen(process.env.PORT);
