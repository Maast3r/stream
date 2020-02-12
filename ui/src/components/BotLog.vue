<template>
  <div id='bot-log-container' class='tile is-vertical'>
    <h6 class='subtitle'>Bot Log</h6>
    <div id='bot-log-chat-container' class='container'>
      <Log
        v-for='(log, index) in logs'
        v-bind:key='log + index'
        v-bind:message='log.message'
        v-bind:time='log.time'
      />
    </div>
  </div>
</template>

<script>
  import Log from './Log';

  const logs = [];

  const socket = new WebSocket('ws://localhost:3000/');
  socket.addEventListener('open', function (event) {
    socket.send('Hey boi');
  });

  socket.addEventListener('message', function (event) {
    logs.push(JSON.parse(event.data));
  });

  const BotLog = {
    components: {
      Log
    },
    data() {
      return {
        logs
      }
    },
    // Autoscroll to the bottom
    updated() {
      const botLogChatContainer = document.getElementById('bot-log-chat-container');
      botLogChatContainer.scrollTop = botLogChatContainer.scrollHeight;
    }
  };

  export default BotLog;
</script>

<style scoped>
#bot-log-chat-container {
  border: 1px solid;
  height: 600px;
  overflow-y: auto;
}
</style>
