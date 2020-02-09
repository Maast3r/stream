<template>
  <div>
    <div>bot log</div>
    <Log v-for='(log, index) in logs' v-bind:key='log + index' v-bind:message='log' />
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
    logs.push(event.data);
  });

  const BotLog = {
    components: {
      Log
    },
    data() {
      return {
        logs
      }
    }
  };

  export default BotLog;
</script>

<style scoped>
</style>
