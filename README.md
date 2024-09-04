# WASD StreamControl Server
**VERY** simple server that serves as the backend for [WASD StreamControl](https://github.com/WASD-Gaming/wasd-streamcontrol).

It allows the application to generate tweets, pull the Startgg stream queue, update scores on Startgg, etc.

Challonge support is _technically_ here but it's dated and missing many of the features I've added for Startgg as I no longer use Challonge to run brackets.

### Getting Started
1. Install node and npm on your machine.

2. Provide a .env file with the following variables:
```
CHALLONGE_API_KEY=
CHALLONGE_BASE_URL=https://api.challonge.com/v1/
START_GG_BASE_URL=https://api.start.gg/gql/alpha
START_GG_BEARER_TOKEN=
```
3. npm install
4. npm start

### TO-DOs
- [ ] Either refactor or remove Challonge as a service.
- [ ] Code clean up.