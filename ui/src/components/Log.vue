<template>
  <article class="message is-primary is-small">
    <div class="message-body">
      {{ message }}
      <time class='is-size-7'>{{ time }}</time>
    </div>
  </article>
</template>

<script>
  export default {
    props: ['message', 'time']
  }
</script>

<style scoped>
.message:not(:last-child) {
  margin-bottom: 0;
}
</style>
