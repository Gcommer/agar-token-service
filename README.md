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

## API

TODO
