// based on (or rather combination  of):
//  - https://github.com/apexad/homebridge-garagedoor-command
//  - https://github.com/apexad/node-aladdin-connect-garage-door/
// all credit goes to apexad.

'use strict'

const aladdinGarageDoor = require('node-aladdin-connect-garage-door');
let Service, Characteristic

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(
    'homebridge-aladdin-connect-garage-door',
    'AladdinConnectGarageDoorOpener',
    AladdinConnectGarageDoorOpener
  );
}

class AladdinConnectGarageDoorOpener {
  constructor (log, config) {
    this.log = log;
    this.name = config.name;
    this.username = config.username;
    this.password = config.password;
    this.statusUpdateDelay = config.status_update_delay || 15;
    this.pollStateDelay = config.poll_state_delay || 0;
    this.deviceNumber = config.device_number || 0;
    this.garageNumber = config.garage_number || 1;
    this.ignoreErrors = config.ignore_errors || false;
    this.logPolling = config.log_polling || false;
    this.allowDebug = config.allow_debug || false;
    this.batteryLowLevel = config.battery_low_level || 15;
  }

  getServices () {
    this.garageDoorService = new Service.GarageDoorOpener(this.name, this.name);
    this.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
      .on('set', this.setState.bind(this))
    this.garageDoorService.getCharacteristic(Characteristic.CurrentDoorState)
      .on('get', this.getState.bind(this));

    const informationService = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, 'iAnatoly')
      .setCharacteristic(Characteristic.Model, 'GenieAladdinGarageDoorOpener')
      .setCharacteristic(Characteristic.SerialNumber, 'iAnatoly/AladdinConnectGarageDoorOpener');

    this.batteryService = new Service.BatteryService();
    this.batteryService.getCharacteristic(Characteristic.BatteryLevel)
      .on('get', this.getBatteryLevel.bind(this));

    return [informationService, this.garageDoorService, this.batteryService];
  }

  setState(isClosed, callback, context) {
    if (context === 'pollState') {
      // The state has been updated by the pollState command - don't run the open/close command
      callback(null);
      return;
    }
  
    var accessory = this;
    var command = isClosed ? 'close' : 'open';
    accessory.log('Command to run: ' + command);
  
    aladdinGarageDoor(
      accessory.username, accessory.password, 
      command, 
      function (text) {
        accessory.log('Set ' + accessory.name + ' to ' + command);
        if (text.indexOf('OPENING') > -1) {
          accessory
            .garageDoorService
            .setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPENING);
          accessory
            .garageDoorService
            .getCharacteristic(Characteristic.TargetDoorState)
            .setValue(Characteristic.TargetDoorState.OPEN, null, 'pollState');
          setTimeout(
            function() {
              accessory
                .garageDoorService
                .setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPEN);
            },
            accessory.statusUpdateDelay * 1000
          );
        } else if (text.indexOf('CLOSING') > -1) {
          accessory
            .garageDoorService
            .setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSING);
          accessory
            .garageDoorService
            .getCharacteristic(Characteristic.TargetDoorState)
            .setValue(Characteristic.TargetDoorState.CLOSED, null, 'pollState');
          setTimeout(
            function() {
              accessory
                .garageDoorService
                .setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
            },
            accessory.statusUpdateDelay * 1000
          );
        }
       callback(null);
     },
     accessory.deviceNumber,
     accessory.garageNumber,
     accessory.allowDebug
    );
  }

  getState(callback) {
    var accessory = this;
    aladdinGarageDoor(
      accessory.username, accessory.password, 
      'status', 
      function (state) {
        var currentState = accessory.ignoreErrors && state === 'STOPPED' ? 'CLOSED' : state;
        if (accessory.logPolling || state !== currentState) {
          accessory.log('State of ' + accessory.name + ' is: ' + state + ' (sent ' + currentState + ')');
        }
        callback(null, Characteristic.CurrentDoorState[currentState], 'getState');
        if (accessory.pollStateDelay > 0) {
            accessory.pollState();
        }
      }, 
      accessory.deviceNumber,
      accessory.garageNumber,
      accessory.allowDebug
    );
  }

  pollState() {
    var accessory = this;

    // Clear any existing timer
    if (accessory.stateTimer) {
      clearTimeout(accessory.stateTimer);
      accessory.stateTimer = null;
    }

    accessory.stateTimer = setTimeout(
      function() {
        accessory.getState(function(err, currentDeviceState) {
          if (err) {
            accessory.log(err);
            return;
          }

          if ([Characteristic.TargetDoorState.OPEN, Characteristic.TargetDoorState.CLOSED].includes(currentDeviceState)) {
            // Set the target state to match the actual state
            // If this isn't done the Home app will show the door in the wrong transitioning state (opening/closing)
            accessory
              .garageDoorService
              .getCharacteristic(Characteristic.TargetDoorState)
              .setValue(currentDeviceState, null, 'pollState');
          }
          accessory
              .garageDoorService
              .setCharacteristic(Characteristic.CurrentDoorState, currentDeviceState);
        })
      },
      accessory.pollStateDelay * 1000
    );
  }

  getBatteryLevel(callback) {
    var accessory = this;
    aladdinGarageDoor(
      accessory.username, accessory.password,
      'battery',
      function (batteryLevel) {
        accessory.batteryService
          .setCharacteristic(Characteristic.StatusLowBattery, batteryLevel < accessory.batteryLowLevel);
        callback(null, batteryLevel, 'getBatteryLevel');
      },
      accessory.deviceNumber,
      accessory.garageNumber,
      accessory.allowDebug
    );
  }
}
