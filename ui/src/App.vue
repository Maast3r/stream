<template>
  <div>
    <main>
      <router-view/>
    </main>
  </div>
</template>

<script>
  export default {
    data: () => ({
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
    })
  }
</script>

<style scoped>
  ul {
    list-style: none;
    display: flex;
    padding: 0;
  }
  li {
    padding: 5px 15px 5px 0;
  }
  li a {
    text-decoration: none;
    color: black;
  }
  li a:hover {
    color: #404040;
  }
</style>
