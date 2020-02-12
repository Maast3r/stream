<template>
  <section class='section'>
    <div class='container'>
      <div class='tile'>
        <h1 class='title'>Ma UI</h1>
        <button class='button is-primary' v-on:click='authorizeExternals'>Authorize Externals</button>
      </div>
      <div class='columns'>
        <div class='column is-one-quarter'>
          <BotLog />
        </div>
        <div class='column'>
          placeholder
        </div>
        <div class='column is-one-half'>
          placeholder
        </div>
      </div>
    </div>
  </section>
</template>

<script>
  import * as RequestManager from '../request-manager';
  import BotLog from './BotLog';

  export default {
    components: {
      BotLog
    },
    data() {
    },
    methods: {
      authorizeExternals() {
        RequestManager.authorizeSpotify();
        RequestManager.authorizeTwitch();
      }
    }
  }
</script>

<style scoped>
  h1 {
    color: purple; 
  }
</style>
