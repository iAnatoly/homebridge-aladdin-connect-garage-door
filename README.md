# homebridge-aladdin-connect-garage-door
[Homebridge](https://github.com/nfarina/homebridge) plugin that supports Genie Aladdin garage door opener.

This plugin is a combo of:
- https://github.com/apexad/homebridge-garagedoor-command
- https://github.com/apexad/node-aladdin-connect-garage-door

Mainly, so you can put username and password into your homebridge config, rather than hardcoding them into javascript, or devising a system to pass them on through docker secrets (I've done both)

## Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-genie-aladdin-garage-opener`
3. Update your configuration file. See the sample below.

## Configuration

Configuration sample:

```json
"accessories": [
  {
    "accessory": "AladdinConnectGarageDoorOpener",
    "name": "Garage Door",
    "username": "your.aladdin.connect.username@gmail.con",
    "password": "",
    "status_update_delay": 15,
    "poll_state_delay": 20,
    "device_number": 0,
    "garage_number": 1
  }
]

```
## Explanation:

Parameter                   | Description
------------------------|------------
**accessory**           | Must always be "AladdinConnectGarageDoorOpener" (required)
**name**                | Name of the Garage Door
**username**            | Your Aladdin Connect username 
**password**            | Your Aladdin Connect password
**status_update_delay** | Time to have door in opening or closing state (defaults to 15 seconds)
**poll_state_delay**    | Time between polling for the garage door's state (leave blank to disable state polling)
**device_number**	| Door number (0-2). Defaults to 0
**garage_number**	| Garage number (1-3). Defaults to 1

