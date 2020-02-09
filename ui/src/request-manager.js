import fetch from 'node-fetch';

const endpoint = 'http://localhost:3000';

function getHeaders() {
  return {
  };
}

export function authorizeTwitch() {
  return fetch(`${endpoint}/twitch`, {
    headers: getHeaders(),
  }).then((response) => response.json()).then((response) => {
    window.open(response.url, '_blank');
    return response;
  });
}

export function authorizeSpotify() {
  return fetch(`${endpoint}/spotify`, {
    headers: getHeaders(),
  }).then((response) => response.json()).then((response) => {
    window.open(response.url, '_blank');
    return response;
  });
}
