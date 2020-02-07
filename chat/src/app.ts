import express from 'express';
import fetch from 'node-fetch';
import URLSearchParams from 'url-search-params';

import * as SpotifyThing from './spotify';
import * as TwitchThing from './twitch';

const app = express();
const appPort = 3000;
const host = `http://localhost:${appPort}`;

app.listen(appPort, () => {
  console.log(`* Server started at ${host}`);
});

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
    TwitchThing.setToken(response.access_token);

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
  ).then((response: any) => {
    console.log(response);
    return response.json();
  }).then((response: any) => {
    console.log(response);
    SpotifyThing.setToken(response.access_token);
  });

  controllerResponse.send('GET authorize-spotify');
});

app.get('/oauth', (_, response: any) => {
  console.log('asdfasdfaf');
  response.send('o');
});
