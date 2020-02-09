import _ from 'lodash';
import fetch from 'node-fetch';
import URLSearchParams from 'url-search-params';

import { eventEmitter } from './app';

const endpoint = 'https://api.spotify.com/v1/me';
const playerEndpoint = `${endpoint}/player`;
const redirectUri = 'http://localhost:3000/authorize-spotify';
const scopes = 'user-read-currently-playing';

export const clientId = process.env.SPOTIFY_CLIENT_ID;
export const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
let accessToken: string;
let refreshToken: string;

function getRequestHeaders() {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
}

export function getCurrentTrack():any {
  return fetch(`${playerEndpoint}/currently-playing`, {
    headers: getRequestHeaders()
  }).then((response: any) =>
    response.json()
  ).then((response: any) => {
    const artists = _.reduce(response.item.artists, (artistsAccumulator: string, artist: any) => {
      if (artistsAccumulator === '') {
        return artist.name;
      } else {
        return `${artistsAccumulator}, ${artist.name}`;
      }
    }, '');

    return {
      artists,
      name: response.item.name,
      url: response.item.external_urls.spotify
    };
  }).catch((error: any) => {
    console.log(error);
    eventEmitter.emit('newBotLog', error);
    return refreshAccessToken().then(getCurrentTrack);
  });
}

function refreshAccessToken() {
  const formBody = new URLSearchParams();
  formBody.set('client_id', clientId);
  formBody.set('client_secret', clientSecret);
  formBody.set('grant_type', 'refresh_token');
  formBody.set('refresh_token', refreshToken);

  return fetch(
    'https://accounts.spotify.com/api/token',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: formBody
    }
  ).then((response: any) => {
    accessToken = response.access_token;
    console.log('* Spotify access token refreshed');
  });
}

export function authorize() {
  return fetch(
    'https://accounts.spotify.com/authorize' +
    `?client_id=${clientId}` +
    '&response_type=code' +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scopes}`
  ).then((response: any) => response.url);
}

export function setTokens(newAccessToken: string, newRefreshToken: string) {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
}
