import firebase from "nativescript-plugin-firebase";
import BackendService from "./BackendService";

export default class PushNotificationService extends BackendService {
  async getPushToken() {
    return await firebase.getCurrentPushToken().then(token => token);
  }
}