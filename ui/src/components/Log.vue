<template>
  <div class='card'>
    <div class='card-content'>
      <div class='content'>
        {{ message }}
        <time class='is-size-7'>{{ time }}</time>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: ['message', 'time']
  }
</script>

<style scoped>
</style>
