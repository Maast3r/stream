// tslint:disable-next-line
const Mixer = require('@mixer/client-node');
// tslint:disable-next-line
const { ShortCodeExpireError, OAuthClient } = require('@mixer/shortcode-oauth');
import _ from 'lodash';
import ws from 'ws';

const clientId = process.env.MIXER_CLIENT_ID;
const mixerClient = new Mixer.Client(new Mixer.DefaultRequestRunner());
const oauthClient = new OAuthClient({
  clientId,
  scopes: [
    'channel:costream:self',
    'channel:details:self',
    'chat:connect',
    'chat:chat',
    'chat:poll_start'
  ],
});

let userInfo: any;
let socket: any;

/**
 * Performs OAuth authentication. Needs user to click link output in console to be
 * successfully authorize.
 *
 * @returns {Promise.<>}
 */
function authenticate() {
  return oauthClient.getCode().then((code: any) => {
    console.log(`\n\nhttps://mixer.com/go?code=${code.code}\n\n`);
    return code.waitForAccept();
  }).catch((error: any) => {
    if (error instanceof ShortCodeExpireError) {
      return authenticate();
    }

    throw error;
  });
}

/**
 * Connects to Mixer's chat.
 *
 * @returns {Promise.<>}
 */
function startChatSocket() {
  mixerClient.request('GET', 'users/current').then((response: any) => {
    // Store the logged in user's details for later reference
    userInfo = response.body;

    // Returns a promise that resolves with our chat connection details.
    return new Mixer.ChatService(mixerClient).join(userInfo.channel.id);
  }).then((response: any) => {
    const body = response.body;
    console.log(body);
    return createChatSocket(userInfo.id, userInfo.channel.id, body.endpoints, body.authkey);
  }).catch((error: any) => {
    console.error('Something went wrong while trying to authenticate.');
    console.error(error);
  });
}

/**
 * Creates a Mixer chat socket and sets up listeners to various chat events.
 *
 * @param {number} userId The user to authenticate as
 * @param {number} channelId The channel id to join
 * @param {string[]} endpoints An array of endpoints to connect to
 * @param {string} authkey An authentication key to connect with
 * @returns {Promise.<>}
 */
function createChatSocket(
    userId: number,
    channelId: number,
    endpoints: string[],
    authkey: string
) {
  socket = new Mixer.Socket(ws, endpoints).boot();

  socket.auth(channelId, userId, authkey).then(() => {
    console.log('Big Boy Bot Online.');
  }).catch((error: object) => {
    console.error('Oh no! An error occurred while trying to start the chat bot.');
    console.error(error);
  });

  socket.on('UserJoin', handleUserJoin);
  socket.on('ChatMessage', handleChatMessage);
  socket.on('SkillAttribution', handleSkillAttribution);

  // Listen for socket errors. You will need to handle these here.
  socket.on('error', (error: any) => {
    console.error('Socket error. Fix.');
    console.error(error);
  });
}

function handleUserJoin(data: any) {
  const username = _.lowerCase(data.username).replace(/\s/g, '');
  console.log('User Joineddddddd ============= ', username);
  if (username === 'gameranma') {
    socket.call('msg', [
      `Yo ${data.username}! I'm testing a chat bot. Here are some commands to try` +
      '[!whatsgood, !costream doomerdinger, !kill costream].'
    ]);
  } else if (username === 'baseballlover723') {
    socket.call('msg', [`Yo ${data.username}! Welcome to the better stream. Take some notes.`]);
  }
}

function handleChatMessage(data: any) {
  const command = _.get(data, 'message.message[0].data');
  console.log('\n\n^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
  console.log('We got a ChatMessage packet! ::: ', command);
  console.log('_________________________________');

  if (command === '!whatsgood') {
    socket.call('msg', ['Yeezy 🌊, Yeezy 🌊, what\'s good? It\'s your boy 😎😎 Max B, what\'s going on? Just checking in on you 👌👌 Appreciate the love 💕 and support The wave 🙌🙌 is here You a wavey dude 🌊🌊🌊🌊❤ anyway, so you already know 🤔🤔🤔 Ain\'t no problem, man, the game... You already know how this game thing goes']);
  } else if (command === '!costream doomerdinger') {
    startCostreamWith(107717670);
  } else if (command === '!kill costream') {
    leaveCostream();
  }
}

function handleSkillAttribution(data: any) {
  socket.call('msg', [`Thanks ${data.username} for sending the ${data.skill.skill_name}!`]);
}

function startCostreamWith(userId: number) {
  console.log('trying to invite doomerdinger');
  const inviteParams: object = {
    body: {
      // inviteeIds: [104567217],
      inviteeIds: [userId],
      validFor: 86400000, // Max time
    }
  };
  return mixerClient.request('POST', 'costreams/invite', inviteParams).then(() => {
    console.log('doomerdinger invited');
  });
}

function leaveCostream() {
  console.log('trying to kill costream');
  return mixerClient.request('DELETE', 'costreams/current').then(() => {
    console.log('costream terminated.');
  });
}

authenticate().then((tokens: any) => {
  mixerClient.use(new Mixer.OAuthProvider(
    mixerClient,
    {
      clientId,
      tokens: {
        access: tokens.data.accessToken,
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
      }
    }
  ));

  startChatSocket();
});
