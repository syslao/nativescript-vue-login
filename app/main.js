import Vue from 'nativescript-vue'
import VueDevtools from 'nativescript-vue-devtools'
import firebase from "nativescript-plugin-firebase"
import BackendService from './services/BackendService' 
import AuthService from './services/AuthService'
import PushNotificationService from './services/PushNotificationService' 
import LoginPage from './components/LoginPage'

//shared among components
export const backendService = new BackendService()
export const authService = new AuthService()
export const pushNotificationService = new PushNotificationService()
import store from './store';

Vue.prototype.$authService = authService
Vue.prototype.$backendService = backendService
Vue.prototype.$pushNotificationService = pushNotificationService

if(TNS_ENV !== 'production') {
  Vue.use(VueDevtools)
}
// Prints Vue logs when --env.production is *NOT* set while building
Vue.config.silent = (TNS_ENV === 'production')

firebase
  .init({
    onAuthStateChanged: data => { 
      console.log((data.loggedIn ? "Logged in to firebase" : "Logged out from firebase") + " (firebase.init() onAuthStateChanged callback)");
      if (data.loggedIn) {
        backendService.token = data.user.uid
        console.log("uID: " + data.user.uid)
        store.commit('setIsLoggedIn', true)
      }
      else {      
        store.commit('setIsLoggedIn', false)
      }
    },
    showNotificationsWhenInForeground: true,
    onMessageReceivedCallback: function(message) {
        console.log("Title: " + message.data.Title);
        console.log("Body: " + message.data.Body);
        // if your server passed a custom property called 'foo', then do this:
        console.log("Value of 'foo': " + message.data.foo);
    },
  })
  .then(
    function(instance) {
      console.log("firebase.init done");
    },
    function(error) {
      console.log("firebase.init error: " + error);
    }
  );

new Vue({
  store,
  render: h => h('frame', [h(LoginPage)])
}).$start()