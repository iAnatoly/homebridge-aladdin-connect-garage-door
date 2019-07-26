// based on (or rather combination  of):
//  - https://github.com/apexad/homebridge-garagedoor-command
//  - https://github.com/apexad/node-aladdin-connect-garage-door/
// all credit goes to apexad.

'use strict'

const aladdinGarageDoor = require('node-aladdin-connect-garage-door');

let Service, Characteristic

module.exports = (homebridge) => {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-aladdin-connect-garage-door', 'AladdinConnectGarageDoorOpener', AladdinConnectGarageDoorOpener)
}

class AladdinConnectGarageDoorOpener {
  constructor (log, config) {
    this.log = log
    this.name = config.name;
    this.username = config.username;
    this.password = config.password;
    this.statusUpdateDelay = config.status_update_delay || 15;
    this.pollStateDelay = config.poll_state_delay || 0;
    this.deviceNumber = config.device_number || 0;
    this.garageNumber = config.garage_number || 1;
  }

  getServices () {
    this.garageDoorService = new Service.GarageDoorOpener(this.name, this.name);
    this.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
        .on('set', this.setState.bind(this))
        .on('get', this.getState.bind(this));
    this.garageDoorService.getCharacteristic(Characteristic.CurrentDoorState)
        .on('get', this.getState.bind(this));
 
    const informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'iAnatoly')
        .setCharacteristic(Characteristic.Model, 'GenieAladdinGarageDoorOpener')
        .setCharacteristic(Characteristic.SerialNumber, 'iAnatoly/AladdinConnectGarageDoorOpener')

    return [informationService, this.garageDoorService]
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
  
    aladdinGarageDoor(accessory.username, accessory.password, command, function (text) {
          accessory.log('Set ' + accessory.name + ' to ' + command);
          if (text.indexOf('OPENING') > -1) {
            accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPENING);
            setTimeout(
              function() {
                accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPEN);
              },
              accessory.statusUpdateDelay * 1000
            );
          } else if (text.indexOf('CLOSING') > -1) {
            accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSING);
            setTimeout(
              function() {
                accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
              },
              accessory.statusUpdateDelay * 1000
            );
          }
         callback(null);
       });
  }

  getState(callback) {
    var accessory = this;
    aladdinGarageDoor(accessory.username, accessory.password, 'status', function (state) {
        accessory.log('State of ' + accessory.name + ' is: ' + state);
        callback(null, Characteristic.CurrentDoorState[state]);
        if (accessory.pollStateDelay > 0) {
            accessory.pollState();
        }
      }, accessory.deviceNumber, accessory.garageNumber);
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
  
          if (currentDeviceState === Characteristic.CurrentDoorState.OPEN || currentDeviceState === Characteristic.CurrentDoorState.CLOSED) {
            // Set the target state to match the actual state
            // If this isn't done the Home app will show the door in the wrong transitioning state (opening/closing)
            accessory.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
              .setValue(currentDeviceState, null, 'pollState');
          }
          accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, currentDeviceState);
        })
      },
      accessory.pollStateDelay * 1000
    );
  }
}
