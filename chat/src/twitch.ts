import _ from 'lodash';
import fetch from 'node-fetch';
import tmi from 'tmi.js';

import { eventEmitter } from './app';
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

  const commandName = _.trim(message);
  const log = `* Executed ${commandName} command`;

  if (commandName === '!dice') {
    client.say(channel, `You rolled a ${rollDice()}`);
  } else if (commandName === '!clipit') {
    createClip(channel);
  } else if (commandName === '!currentsong') {
    SpotifyThing.getCurrentTrack().then(({ artists, name, url }: any) => {
      client.say(channel, `Currently playing: ${name} by ${artists} - ${url}`);
    });
  }
  console.log(`* Executed ${commandName} command`);
  eventEmitter.emit('newBotLog', log);
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
  const log = `* Chatbot connected to ${address}:${port}`;
  console.log(log);
  eventEmitter.emit('newBotLog', log);
}

function onJoinHandler(channel: string, username: string, self: boolean) {
  if (!self && username !== 'maast3r') {
      // client.say(channel, `Welcome ${username} to the big boi club!`);
    const log = `* ${username} has joined the channel`;
    console.log(log);
    eventEmitter.emit('newBotLog', log);
  }
}

export function authorize() {
  return fetch(
    'https://id.twitch.tv/oauth2/authorize' +
    `?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    '&response_type=code' +
    `&scope=${scopes}`
  ).then((response: any) => response.url);
}

export function getUserId() {
  return fetch(`${endpoint}/users?login=maast3r`, {
    headers: getRequestHeaders()
  }).then((response: any) =>
    response.json()
  ).then((response: any) => {
    userId = response.data[0].id;
    const log = '* Chat bot has been authorized';
    console.log(log)
    eventEmitter.emit('newBotLog', log);
    return userId;
  });
}

export function setTokens(newAccessToken: string, newRefreshToken: string) {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
}
