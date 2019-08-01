// based on (or rather combination  of):
//  - https://github.com/apexad/homebridge-garagedoor-command
//  - https://github.com/apexad/node-aladdin-connect-garage-door/
// all credit goes to apexad.

'use strict'

const api = require('./aladdin-api');

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
    this.getAuthToken = this.getAuthToken.bind(this);
    this.getState = this.getState.bind(this);
    this.setState = this.setState.bind(this);
  }
  
  getServices () {
    this.garageDoorService = new Service.GarageDoorOpener(this.name, this.name);
    this.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
        .on('set', (value,callback)=>{ this.setState(value).then(res=>callback(null, res)) })
        .on('get', (callback)=>{ this.getState().then(res=>callback(null, res)) });
    this.garageDoorService.getCharacteristic(Characteristic.CurrentDoorState)
        .on('get', (callback)=>{ this.getState().then(res=>callback(null, res)) });
 
    const informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'iAnatoly')
        .setCharacteristic(Characteristic.Model, 'GenieAladdinGarageDoorOpener')
        .setCharacteristic(Characteristic.SerialNumber, 'iAnatoly/AladdinConnectGarageDoorOpener');

    return [informationService, this.garageDoorService];
  }

  async getAuthToken () {
    AliBaba.authToken = AliBaba.authToken || await api.getToken(this.username, this.password, this.deviceNumber);    
    return AliBaba.authToken;
  }

  async sleep(time_s) {
      setTimeout(eh=>{}, time_s * 1000);
  }
     
  async setState(isClosed) {
    const authToken = await this.getAuthToken();
    this.log('Sending "'+isClosed?'open':'close'+'" command to door '+this.name);
    const result = await api.sendCommand(isClosed, authToken, this.garageNumber);
    this.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState[result]);
  }

  async getState() {
    const authToken = await this.getAuthToken();
    const state = await api.getState(authToken, this.garageNumber);
    this.log('State of ' + this.name + ' is: ' + state);
    return Characteristic.CurrentDoorState[state];   
  }
}
