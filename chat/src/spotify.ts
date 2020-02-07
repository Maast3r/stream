import _ from 'lodash';
import fetch from 'node-fetch';

const endpoint = 'https://api.spotify.com/v1/me';
const playerEndpoint = `${endpoint}/player`;
const redirectUri = 'http://localhost:3000/authorize-spotify';
const scopes = 'user-read-currently-playing';

export const clientId = process.env.SPOTIFY_CLIENT_ID;
export const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
let token: string;

function getRequestHeaders() {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export function getCurrentTrack() {
  console.log(token);
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
  });
}

function authorize() {
  return fetch(
    'https://accounts.spotify.com/authorize' +
    `?client_id=${clientId}` +
    '&response_type=code' +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scopes}`
  ).then((response: any) => {
    console.log(response.url);
  });
}

export function setToken(newToken: string) {
  token = newToken;
  console.log(token);
  return token;
}

authorize();
