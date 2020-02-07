import _ from 'lodash';
import fetch from 'node-fetch';
import tmi from 'tmi.js';

import * as SpotifyThing from './spotify';

export let token: string;
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
    SpotifyThing.getCurrentTrack().then(({ artists, name, url }) => {
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
    'Authorization': `Bearer ${token}`,
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
    '&redirect_uri=http://localhost:3000/authorize-twitch' +
    '&response_type=code' +
    `&scope=${scopes}`
  ).then((response: any) => {
    console.log(response.url);
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

export function setToken(newToken: string) {
  token = newToken;
  return token;
}

authorize();
