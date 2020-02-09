<template>
  <div>
    <h1>Home</h1>
    <button v-on:click='authorizeExternals'>Authorize Externals</button>
    <BotLog />
  </div>
</template>

<script>
  import * as RequestManager from '../request-manager';
  import BotLog from './BotLog';

  export default {
    components: {
      BotLog
    },
    data() {
      return {
        links: [
          {
            name: 'Home',
            to: '/'
          },
          {
            name: 'Bad Link',
            to: '/random-bad-url'
          }
        ]
      }
    },
    methods: {
      authorizeExternals: function(event) {
        console.log(event);
        RequestManager.authorizeSpotify();
        RequestManager.authorizeTwitch();
      }
    }
  }
</script>

<style scoped>
  h1 {
    color: blue
  }
</style>
