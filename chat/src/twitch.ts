import _ from 'lodash';
import fetch from 'node-fetch';
import open from 'open';
import tmi from 'tmi.js';

import * as SpotifyThing from './spotify';

let accessToken: string;
let refreshToken: string;
let userId: string;

// Define configuration options
const opts = {
  channels: [
    'maast3r'
  ],
  identity: {
    password: process.env.TWITCH_BOT_OAUTH,
    username: 'maast3rbot'
  }
};
// Create a client with our options
export const clientId = process.env.TWITCH_CLIENT_ID;
export const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const client = new (tmi.client as any)(opts);
const endpoint = 'https://api.twitch.tv/helix';
const redirectUri = 'http://localhost:3000/authorize-twitch';
const scopes = 'clips:edit';

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.on('join', onJoinHandler);

// Connect to Twitch
client.connect();

// Called every time a message comes in
function onMessageHandler(channel: string, userstate: any, message: string , self: boolean) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  const commandName = _.trim(message);

  // If the command is known, let's execute it
  if (commandName === '!dice') {
    client.say(channel, `You rolled a ${rollDice()}`);
    console.log(`* Executed ${commandName} command`);
  } else if (commandName === '!clipit') {
    createClip(channel);
    console.log(`* Executed ${commandName} command`);
  } else if (commandName === '!currentsong') {
    SpotifyThing.getCurrentTrack().then(({ artists, name, url }: any) => {
      client.say(channel, `Currently playing: ${name} by ${artists} - ${url}`);
    });
    console.log(`* Executed ${commandName} command`);
  }
}

function rollDice() {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

function getRequestHeaders() {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
}

function createClip(channel: string) {
  return fetch(`${endpoint}/clips?broadcaster_id=${userId}`, {
    headers: getRequestHeaders(),
    method: 'POST'
  }).then((response: any) =>
    response.json()
  ).then((response: any) => {
    client.say(channel, `Here's your clip: ${response.data[0].edit_url}`);
  });
}

function onConnectedHandler(address: string, port: string) {
  console.log(`* Chatbot connected to ${address}:${port}`);
}

function onJoinHandler(channel: string, username: string, self: boolean) {
  if (!self && username !== 'maast3r') {
    client.say(channel, `Welcome ${username} to the big boi club!`);
    console.log(`* ${username} has joined the channel`);
  }
}

function authorize() {
  return fetch(
    'https://id.twitch.tv/oauth2/authorize' +
    `?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    '&response_type=code' +
    `&scope=${scopes}`
  ).then((response: any) => {
    console.log(response.url);
    // I honestly don't know why i have to do this. response.url spits out
    // exactly what I need, but when I try to run `open(response.url)`, the
    // resulting webpage has no request queries. Therefore I am builindg my
    // own version of response.url that works.
    // const builtUri = 'https://passport.twitch.tv/sessions/new' +
    //   `?client_id=${clientId}` +
    //   '%26oauth_request=false' +
    //   `&redirect_uri=${redirectUri}` +
    //   '&response_type=code' +
    //   `&scope=${scopes}` +
    //   '&username=' +
    //   '&redirect_path=' +
    //     'https%3A%2F%2Fid.twitch.tv%2Foauth2%2Fauthorize' +
    //     `%3Fclient_id%3D${clientId}` +
    //     '%26redirect_uri%3D' +
    //       `http%3A%2F%2Flocalhost%3A3000%2Fauthorize-twitch` +
    //       '%26response_type%3Dcode' +
    //       `%26scope%3D${_.replace(scopes, ':', '%3A')}`;
    // // console.log(builtUri);
    // // console.log("\n");
    // // open(builtUri);
    // const a = "https://www.google.com/search?q=test&as=t" + encodeURIComponent('&oq=test');
    // console.log(a);
    // console.log("\n");
    // open(a);
    // const b = encodeURI(response.url);
    // console.log(b);
    // open(b);
  });
}

export function getUserId() {
  return fetch(`${endpoint}/users?login=maast3r`, {
    headers: getRequestHeaders()
  }).then((response: any) =>
    response.json()
  ).then((response: any) => {
    userId = response.data[0].id;
    console.log('* Chat bot has been authorized');
    return userId;
  });
}

export function setTokens(newAccessToken: string, newRefreshToken: string) {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
}

authorize();
