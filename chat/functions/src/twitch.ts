import _ from 'lodash';
import fetch from 'node-fetch';
import tmi from 'tmi.js';

import { eventEmitter, host } from './app';
import * as SpotifyThing from './spotify';

let accessToken: string;
let refreshToken: string;
let userId: string;

const opts = {
  channels: [
    'maast3r'
  ],
  identity: {
    password: process.env.TWITCH_BOT_OAUTH,
    username: 'maast3rbot'
  }
};
export const clientId = process.env.TWITCH_CLIENT_ID;
export const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const client = new (tmi.client as any)(opts);
const endpoint = 'https://api.twitch.tv/helix';
const scopes = 'clips:edit';


const commands:any = {
  '!clipit': createClip,
  '!currentsong': getCurrentSong,
  '!dice': rollDice
}

client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.on('join', onJoinHandler);

client.connect();

function onMessageHandler(channel: string, userstate: any, message: string , self: boolean) {
  if (self) { return; } // Ignore messages from the bot

  const commandName = _.trim(message);
  const command = commands[commandName];

  if (command) {
    command(channel);

    eventEmitter.emit('newBotLog',  `* Executed ${commandName} command`);
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

function getCurrentSong(channel: string) {
  return SpotifyThing.getCurrentTrack().then(({ artists, name, url }: any) => {
    client.say(channel, `Currently playing: ${name} by ${artists} - ${url}`);
  });
}

function onConnectedHandler(address: string, port: string) {
  eventEmitter.emit('newBotLog',  `* Chatbot connected to ${address}:${port}`);
}

function onJoinHandler(channel: string, username: string, self: boolean) {
  if (!self && username !== 'maast3r') {
      // client.say(channel, `Welcome ${username} to the big boi club!`);
    eventEmitter.emit('newBotLog', `* ${username} has joined the channel`);
  }
}

export function authorize() {
  return fetch(
    'https://id.twitch.tv/oauth2/authorize' +
    `?client_id=${clientId}` +
    `&redirect_uri=${host}/authorize/twitch/redirect` +
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
    eventEmitter.emit('newBotLog', '* Chat bot has been authorized');
    userId = response.data[0].id;
    return userId;
  });
}

export function setTokens(newAccessToken: string, newRefreshToken: string) {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
}
