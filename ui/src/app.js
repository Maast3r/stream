import Vue from 'vue';
import App from './App.vue';
import router from './router';

Vue.config.productionTip = false;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then((registration) => {
      console.log('SW registered: ', registration);
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

const app = new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>',
});
