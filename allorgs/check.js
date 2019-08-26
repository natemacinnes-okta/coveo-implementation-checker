const request = require('request');
const fs = require('fs');
const nrofdaysAnalytics = 25;
const debug = false;

class InspectAllOrganizations {

  constructor() {
    let settings = require('../secrets/settings.json');
    this.apiKey = settings.apiKey;
    this.baseUrl = settings.baseUrl;
  }

  myFirst() {
    return new Promise(function (resolve, reject) {
      console.log('Entering First');
      setTimeout(function() { console.log('First');resolve('first data');},800);
    });
  }

  mySecond(){
    return new Promise(function (resolve, reject) {
      console.log('Entering Second');
      setTimeout(function() { console.log('Second');resolve('second data');},200);
    });
  } 

  async start() {
     await this.myFirst().then(function (data) {
      console.log(data);
      console.log('First Done');});
    await this.mySecond().then(function (data) {
        console.log(data);
        console.log('Second Done');
      });
  }
}

let inspect = new InspectAllOrganizations();
inspect.start();
