/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint esversion: 6 */
'use strict';

// For profiling: comment out the following block and connect to
// http://c4milo.github.io/node-webkit-agent/26.0.1410.65/inspector.html?host=localhost:19999&page=0
/*
var agent = require('webkit-devtools-agent');
agent.start({
    port: 19999,
    bind_to: '0.0.0.0',
    ipc_port: 13333,
    verbose: true
});
*/

// you have to require the utils module and call adapter function
const utils = require('@iobroker/adapter-core');
const adapterName = require('./package.json').name.split('.').pop();

let adapter;

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {name: adapterName});

    adapter = new utils.Adapter(options);

    adapter.on('ready', ready);
    adapter.on('unload', unload);

    return adapter;
}

// const SCAN_INTERVAL = 10000;
let scanner = undefined;
let devices = undefined;

async function ready() {
    // Own libraries
    const LogWrapper = require('castv2-player').LogWrapper;
    const Scanner = require('castv2-player').Scanner(new LogWrapper(adapter.log));

    let webPort = 8082;
    if (adapter.config.web) {
        try {
           const webObj = await adapter.getForeignObjectAsync(`system.adapter.${adapter.config.web}`);
           webPort = webObj.native.port;
        } catch (e) {
            adapter.log.error(`Cannot get web port: ${e.toString()}`);
            webPort = 8082;
        }
    }

    const ChromecastDevice = await require('./lib/chromecastDevice')(adapter, webPort);

    devices = [];

    // Create manually added devices (if any)
    if (adapter.config.manualDevices) {
        for (let i = 0; i < adapter.config.manualDevices.length; i++) {
            // Emulate ID
            let device = adapter.config.manualDevices[i];
            device.id = `${i}-${device.name}`;
            // Emulate registerForUpdates
            device.registerForUpdates = function () {};

            devices.push(new ChromecastDevice(device, true));
        }
    }

    // var chromecastDevices = {};
    scanner = new Scanner(connection => {
        adapter.log.debug(`New connection: ${JSON.stringify(connection)}`);
        devices.push(new ChromecastDevice(connection, false));
    });

    // in this template all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates('*');
}

function unload(callback) {
    try {
        scanner.destroy();
        devices.forEach(device => device.destroy());
        devices = undefined;
    } catch (error) {
        console.error(error);
    }

    callback();
}

// If started as allInOne/compact mode => return function to create instance
if (typeof module !== undefined && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}
