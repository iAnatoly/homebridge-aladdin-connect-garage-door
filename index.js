// based on (or rather combination  of):
//  - https://github.com/apexad/homebridge-garagedoor-command
//  - https://github.com/apexad/node-aladdin-connect-garage-door/
// all credit goes to apexad.

'use strict'

const aladdinGarageDoor = require('./aladdin-api');
const callbackify = require('util-callbackify');

let Service, Characteristic

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(
    'homebridge-aladdin-connect-garage-door',
    'AladdinConnectGarageDoorOpener',
    AliBaba
  );
}

// https://en.wikipedia.org/wiki/Ali_Baba_and_the_Forty_Thieves
class AliBaba {

  constructor (log, config) {
    this.log = log;
    this.name = config.name;
    this.username = config.username;
    this.password = config.password;
    this.statusUpdateDelay = config.status_update_delay || 15;
    this.pollStateDelay = config.poll_state_delay || 0;
    this.deviceNumber = config.device_number || 0;
    this.garageNumber = config.garage_number || 1;
    this.authToken = null;
  }
  
  getServices () {
    this.garageDoorService = new Service.GarageDoorOpener(this.name, this.name);
    this.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
        .on('set', callbackify(this.setState))
        .on('get', callbackify(this.getState));
    this.garageDoorService.getCharacteristic(Characteristic.CurrentDoorState)
        .on('get', callbackify(this.getState));
 
    const informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'iAnatoly')
        .setCharacteristic(Characteristic.Model, 'GenieAladdinGarageDoorOpener')
        .setCharacteristic(Characteristic.SerialNumber, 'iAnatoly/AladdinConnectGarageDoorOpener');

    return [informationService, this.garageDoorService];
  }

  async getAuthToken() {
    if (!this.getAuthToken) {
        this.authToken = await aladdinGarageDoor.getToken(this.username, this.password, this.deviceNumber);    
    }
    return this.authToken;
  }

  async sleep(time_s) {
      setTimeout(eh=>{}, time_s * 1000);
  }
     
  async setState(isClosed) {
    let authToken = this.getAuthToken();
    let result;
    if (isClosed) {
        this.log("SESAME, OPEN!");
        result = await aladdinGarageDoor.openDoor(authToken, this.garageNumber);
    } else {
        this.log("SESAME, CLOSE!");
        result = await aladdinGarageDoor.closeDoor(authToken, this.garageNumber);
    }
    this.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState[result]);
  }

  async getState(callback) {
    let authToken = await this.getAuthToken();
    let state = await this.aladdinGarageDoor.getState(authToken, this.garageNumber);
    this.log('State of ' + this.name + ' is: ' + state);
    this.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState[state]);   
  }
}
