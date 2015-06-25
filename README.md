# Agar.io Token Service

This website provides a pooling service for Agar.io connection
tokens. It consists of generous clients which "donate" unused (server,
token) pairs and greedy clients which claim tokens for servers they
want to connect to.

This service is expected to be short lived if/when Zeach decides to
tie tokens to the IP address which requested them. For that reason a
"kill" message is integrated so that anyone who uses this service in
their code can detect that agar.io has been updated in a way that
obviates the need for this service.

Source: https://github.com/Gcommer/agar-token-service

If you use this service please have your clients donate more tokens
then you take :)

If you want to help donate extra tokens:
https://github.com/Gcommer/agar-token-donator

At some time, tokens may be restricted by User-Agent. If this becomes
an issue, the following User-Agent should be used by all clients for
requesting tokens from 'm.agar.io' and redeeming them during the
websocket connection.

`Mozilla/5.0 (Windows NT 6.3; rv:36.0) Gecko/20100101 Firefox/36.0`

## API

All requests are simple HTTP GET requests to the specified URLs. CORS
is enabled to allow requests from all hosts.

All of these requests return JSON objects with a `msg` field. Any API
request may return a `msg` of "KILLED", at which point your clients
should cease using the service.

### Status

URL: `/status[?all]`

Returns: `{ msg: 'status', status: {...} }`

`status` is a JSON object mapping all known servers -> number of
available tokens.

The query string is optional. If the query parameter "all" is sent,
then all servers we've received tokens for will be returned.
Otherwise, only servers with currently available tokens will be
returned.

### Donate

URL: `/donate?server=1.2.3.4:1234&token=asdf[&timeout=30000]`

Returns: `{ msg: 'thank_you' | 'invalid_token' | 'invalid_url' }`

'thank_you' indicates successful donation; 'invalid_url' or
'invalid_token' signify that you sent bad data. URLs must be 4-octet
IPv4 addresses with a port number (separated by a colon). `timeout` is
an optional parameter specifying how long the server should keep the
token for. Tokens typically expire after 60 seconds.

### Claim

URL: `/claim?server=1.2.3.4:1234`

Returns: `{ msg: 'unavailable' | 'available' [, token: '...' ] }`

`token` field is only set if a token for the requested server was
available.

`time` is the time when the token was submitted (in UTC milliseconds
since the UNIX epoch).

`timeout` is the time when the token should be considered expired (in
UTC milliseconds since the UNIX epoch).
