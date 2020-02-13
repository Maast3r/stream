import * as functions from 'firebase-functions';

import _ from 'lodash';
import events from 'events';
import express from 'express';
import fetch from 'node-fetch';
import URLSearchParams from 'url-search-params';
import { Server } from 'ws';

import * as SpotifyThing from './spotify';
import * as TwitchThing from './twitch';

const app = express();
const appPort = 3001;
export const host = `http://localhost:${appPort}`;
const corsWhiteList = [
  'https://localhost:9000',
  'https://maui-95ae3.web.app/#/',
  'https://maui-95ae3.firebaseapp.com/#/'
];

const server = app.listen(appPort, () => {
  console.log(`* Server started at ${host}`);
});
const websocketServer = new Server({ server });

export const eventEmitter = new events.EventEmitter();

app.use((request: any, response: any, next: any) => {
  const requestOrigin = request.headers.origin;

  if (_.includes(corsWhiteList, requestOrigin)) {
    response.header('Access-Control-Allow-Origin', requestOrigin);
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  }
  next();
})

app.get('/authorize/twitch/redirect', (request: any, controllerResponse: any) => {
  fetch(
    'https://id.twitch.tv/oauth2/token' +
    `?client_id=${TwitchThing.clientId}` +
    `&client_secret=${TwitchThing.clientSecret}` +
    `&code=${request.query.code}` +
    '&grant_type=authorization_code' +
    `&redirect_uri=${host}/oauth`,
    {
      method: 'POST'
    }
  ).then((response: any) =>
    response.json()
  ).then((response: any) => {
    TwitchThing.setTokens(response.access_token, response.refresh_token);

    return TwitchThing.getUserId();
  });

  controllerResponse.send('GET authorize-twitch');
});

app.get('/authorize/spotify/redirect', (request: any, controllerResponse: any) => {
  const formBody = new URLSearchParams();
  formBody.set('client_id', SpotifyThing.clientId);
  formBody.set('client_secret', SpotifyThing.clientSecret);
  formBody.set('code', request.query.code);
  formBody.set('grant_type', 'authorization_code');
  formBody.set('redirect_uri', `${host}/authorize/spotify/redirect`);

  fetch(
    'https://accounts.spotify.com/api/token',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: formBody
    }
  ).then((response: any) =>
    response.json()
  ).then((response: any) => {
    SpotifyThing.setTokens(response.access_token, response.refresh_token);
    eventEmitter.emit('newBotLog',  '* Spotify authorized');
  });

  controllerResponse.send('GET authorize/spotify/redirect');
});

app.get('/oauth', (_, response: any) => {
  response.send('oauth');
});

app.get('/authorize/twitch', async (request: any, controllerResponse: any) => {
  controllerResponse.send({ url: await TwitchThing.authorize() });
});

app.get('/authorize/spotify', async (request: any, controllerResponse: any) => {
  controllerResponse.send({ url: await SpotifyThing.authorize() });
});

function noop() {}

function websocketHeartbeat() {
  this.alive = true;
}

// Handle broken websocket connecitons
setInterval(() => {
  websocketServer.clients.forEach((client: any) => {
    if (client.isAlive === false) return client.terminate();

    client.isAlive = false;
    client.ping(noop);
  });
}, 30000);

websocketServer.on('connection', (client: any) => {
  client.isAlive = true;

  client.on('message', (message: string) => {
    client.send(JSON.stringify({
      message: 'Hey boi, you connected',
      time: new Date().toLocaleTimeString()
    }));
  });

  client.on('pong', websocketHeartbeat);
});

eventEmitter.on('newBotLog', (newLog: any) => {
  console.log(newLog);
  websocketServer.clients.forEach((client) => {
    client.send(JSON.stringify({
      message: newLog,
      time: new Date().toLocaleTimeString()
    }));
  });
});

// export const chatbot = functions.https.onRequest(app);
export const chatbot = functions.https.onRequest((request, response) => {
  response.send('Hello from Firebase!\n\n');
 });
