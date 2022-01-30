<p align="center">
  <a href="https://github.com/homebridge/homebridge/wiki/Verified-Plugins#verified-plugins"><img alt="Homebridge Verified" src="https://raw.githubusercontent.com/iAnatoly/homebridge-aladdin-connect-garage-door/master/branding/homebridge_genie_aladdin_connect_plugin_logo.png" width="500px"></a>
</p>

*This package is deprecated, please use https://github.com/derek-miller/homebridge-genie-aladdin-connect (https://www.npmjs.com/package/homebridge-aladdin-connect-garage-door) instead*

# homebridge-aladdin-connect-garage-door
[![npm](https://badgen.net/npm/v/homebridge-aladdin-connect-garage-door)](https://www.npmjs.com/package/homebridge-aladdin-connect-garage-door)
[![npm](https://badgen.net/npm/dt/homebridge-aladdin-connect-garage-door)](https://www.npmjs.com/package/homebridge-aladdin-connect-garage-door)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

[Homebridge](https://github.com/homebridge/homebridge) plugin that supports Genie Aladdin garage door opener.  
This plugin is not affiliated with the Genie company.

This plugin is a combo of:
- https://github.com/apexad/homebridge-garagedoor-command
- https://github.com/apexad/node-aladdin-connect-garage-door

Mainly, so you can put username and password into your homebridge config, rather than hardcoding them into javascript, or devising a system to pass them on through docker secrets (I've done both). Also, homebridge won't be forking a shell and an extra node process every time it needs to issue a command, which (considering the state monitoring every 15 seconds) saves quite a lot of CPU cycles. 

## Configuration
This easiest way to use this plugin is to use [homebridge-config-ui-x](https://www.npmjs.com/package/homebridge-config-ui-x).  
To configure manually, add to the `accessories` section of Homebridge's `config.json` after installing the plugin.

**Config:**
```json
"accessories": [
  {
    "accessory": "AladdinConnectGarageDoorOpener",
    "name": "Garage Door",
    "username": "",
    "password": "",
    "status_update_delay": 15,
    "poll_state_delay": 20,
    "device_number": 0,
    "garage_number": 1,
    "battery_low_level": 15,
    "ignore_errors": true,
    "log_polling": false,
    "allow_debug": false
  }
]

```
## Explanation:

Parameter               | Description
------------------------|------------
**accessory**           | Must always be "AladdinConnectGarageDoorOpener" (required)
**name**                | Name of the Garage Door
**username**            | Your Aladdin Connect username (email address). NOTE: use 'owner' username. Delegated access does not work
**password**            | Your Aladdin Connect password
**status_update_delay** | Time to have door in opening or closing state (defaults to 15 seconds)
**poll_state_delay**    | Time between polling for the garage door's state (leave blank to disable state polling)
**device_number**	| Genie Aladdin Connect device number (0-2). Defaults to 0
**garage_number**	| Garage number (1-3). Defaults to 1
**battery_low_level**	| Threshold for low battery warning
**ignore_errors**	| true/false. Causes the plugin to replace 'STOPPED' status with 'CLOSED' (defaults to false)
**log_polling**         | true/false. Poll logs only show on error; Set to true to log every poll (defaults to false)
**allow_debug**         | true/false. Dumps a lot of debug info to stdout. (defaults to false)

## Note:

I was unable to get proper response from the API when I used a secondary (invited) Aladdin Connect credentials. As a workaround, I had to use the primary login credentials instead. I advise you do the same.

The `ignore_errors` config option is in place to prevent false OPEN events from occuring if the aladdin connect API fails to respond. Events where STOPPED is replaced with CLOSED are logged, but consider this a word of caution that setting this option to true ignores errors and could incorrectly report your garage door as CLOSED when it is not.
