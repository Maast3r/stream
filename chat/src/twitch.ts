// const tmi = require('tmi.js');
import express from 'express';
import fetch from 'node-fetch';
import tmi from 'tmi.js';

const app = express();
const appPort = 8080;
const host = `http://localhost:${appPort}`;

let token: string;
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
const client = new (tmi.client as any)(opts);
const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const endpoint = 'https://api.twitch.tv/helix';

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.on('join', onJoinHandler);

// Connect to Twitch
client.connect();

// Called every time a message comes in
function onMessageHandler(channel: string, userstate: any, msg: string , self: boolean) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  const commandName = msg.trim();

  // If the command is known, let's execute it
  if (commandName === '!dice') {
    client.say(channel, `You rolled a ${rollDice()}`);
    console.log(`* Executed ${commandName} command`);
  } else if (commandName === '!clipit') {
    createClip(channel);
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

// Called every time the bot connects to Twitch chat
function onConnectedHandler(address: string, port: string) {
  console.log(`* Connected to ${address}:${port}`);
}

function onJoinHandler(channel: string, username: string, self: boolean) {
  if (!self && username !== 'maast3r') {
    client.say(channel, `Welcome ${username} to the big boi club!`); 
    console.log(`* ${username} has joined the channel`);
  }
}

function authenticate() {
  return fetch(
    'https://id.twitch.tv/oauth2/authorize' +
    `?client_id=${clientId}` +
    `&redirect_uri=${host}/authenticate` +
    '&response_type=code' +
    '&scope=clips:edit'
  ).then((response: any) => {
    console.log(response);
  });
}

function getUserId() {
  return fetch(`${endpoint}/users?login=maast3r`, {
    headers: getRequestHeaders()
  }).then((response: any) =>
    response.json()
  ).then((response: any) => {
    userId = response.data[0].id;
    console.log('* Bot has been authorized')
    return userId;
  });
}

app.listen(appPort, () => {
  console.log(`server started at ${host}`);
});

app.get('/authenticate', (request: any, _) => {
  return fetch(
    'https://id.twitch.tv/oauth2/token' +
    `?client_id=${clientId}` +
    `&client_secret=${clientSecret}` +
    `&code=${request.query.code}` +
    '&grant_type=authorization_code' +
    `&redirect_uri=${host}/oauth`, {
      method: 'POST'
    }
  ).then((response: any) =>
    response.json()
  ).then((response: any) => {
    token = response.access_token;

    return getUserId();
  });
});

authenticate();
