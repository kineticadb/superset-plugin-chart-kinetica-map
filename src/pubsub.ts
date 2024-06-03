export default class PubSub {
  subscribers: any[];

  constructor() {
    this.subscribers = [];
  }

  subscribe(subscriber: any) {
    if (typeof subscriber !== "function") {
      throw new Error(
        `${typeof subscriber} is not a valid argument for subscribe method, expected a function instead`
      );
    }
    this.subscribers = [...this.subscribers, subscriber];
  }

  unsubscribe(subscriber: any) {
    if (typeof subscriber !== "function") {
      throw new Error(
        `${typeof subscriber} is not a valid argument for unsubscribe method, expected a function instead`
      );
    }
    this.subscribers = this.subscribers.filter((sub) => sub !== subscriber);
  }

  publish(payload: any) {
    this.subscribers.forEach((subscriber) => subscriber(payload));
  }
}
