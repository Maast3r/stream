import _ from 'lodash';
import events from 'events';
import express from 'express';
import fetch from 'node-fetch';
import URLSearchParams from 'url-search-params';
import { Server } from 'ws';

import * as SpotifyThing from './spotify';
import * as TwitchThing from './twitch';

const app = express();
const appPort = 3000;
const host = `http://localhost:${appPort}`;
const corsWhiteList = ['https://localhost:9000'];

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

app.get('/authorize-twitch', (request: any, controllerResponse: any) => {
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

app.get('/authorize-spotify', (request: any, controllerResponse: any) => {
  const formBody = new URLSearchParams();
  formBody.set('client_id', SpotifyThing.clientId);
  formBody.set('client_secret', SpotifyThing.clientSecret);
  formBody.set('code', request.query.code);
  formBody.set('grant_type', 'authorization_code');
  formBody.set('redirect_uri', `${host}/authorize-spotify`);

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

    const log = '* Spotify authorized';
    eventEmitter.emit('newBotLog', log);
    console.log(log);
  });

  controllerResponse.send('GET authorize-spotify');
});

app.get('/oauth', (_, response: any) => {
  response.send('o');
});

app.get('/twitch', async (request: any, controllerResponse: any) => {
  controllerResponse.send({ url: await TwitchThing.authorize() });
});

app.get('/spotify', async (request: any, controllerResponse: any) => {
  controllerResponse.send({ url: await SpotifyThing.authorize() });
});

websocketServer.on('connection', (websocket: any) => {
  eventEmitter.on('newBotLog', (newLog) => {
    websocket.send(JSON.stringify({
      message: newLog,
      time: new Date().toLocaleTimeString()
    }));
  });

  websocket.on('message', (message: string) => {
    console.log(`received: ${message}`);

    websocket.send(JSON.stringify({
      message: 'Hey boi, you connected',
      time: new Date().toLocaleTimeString()
    }));
  });
});


