﻿/*
    ioBroker.chromecast Widget-Set

    version: "0.2.0"

    Copyright 10.2015-2016 Vegetto<iobroker@angelnu.com>

*/
"use strict";

// add translations for edit mode
if (vis.editMode) {
    $.extend(true, systemDictionary, {
        "nDevs": {
            "en": "Devices"
        },
        "oid_dev_": {
            "en": "id"
        },
        "group_device": {
            "en": "Generated - Do not change"
        },
        "oid_connected_": {
            "en": "connected id"
        },
        "oid_url2play_": {
            "en": "url2play id"
        }
    });
}

// add translations for non-edit mode
$.extend(true, systemDictionary, {
    "Instance":  {"en": "Instance", "de": "Instanz", "ru": "Инстанция"}
});


//Helpers
function getValidDevId(devId){
    
    var devIdParts = devId.split(".");
    if (devIdParts.length < 3) {
        console.log("Error: "+devId+" is not a device/channel/state");
        return undefined;
    }
    
    if (devIdParts[0] != "chromecast") {
        console.log("Error: "+devId+" does not bellong to the chromecast adapter");
        return undefined;
    }
    
    var normDevice =  devIdParts[0]+'.'+devIdParts[1]+'.'+devIdParts[2];
    
    if (vis.states[normDevice+".status.connected.val"] === undefined){
        console.log("Error: "+normDevice+".status.connected not found");
        return undefined;
    }
    
    return normDevice;
    
}

function registerForDeviceUpdates($widget, ioBrokerState){
    //Check if state exits
    if (vis.states[ioBrokerState+'.val'] === undefined) {
        console.log("ERROR: "+ioBrokerState+" not available.")
        setWidget(undefined);
    } else{
        //register for iobroker state updates
        vis.states.bind(ioBrokerState + '.val', function (e, newVal, oldVal) {
            console.log("Updated "+ioBrokerState+": "+newVal);
            setWidget(newVal);
        });
        setWidget(vis.states[ioBrokerState + '.val']);

        //register for widget state updates
        $widget.change(function (evt) {
            console.log("Sending to "+ioBrokerState+": "+ getWidgetVal());
            vis.setValue(ioBrokerState, getWidgetVal());
        });
    }
    
    function setWidget(newVal){
        if ($widget.attr('type') == 'checkbox')
            $widget.prop('checked', newVal);
        else
            $widget.val(newVal);
    }
    
    function getWidgetVal(){
        if ($widget.attr('type') == 'checkbox')
            return $widget.prop('checked');
        else
            return $widget.val();
    }
}

// this code can be placed directly in chromecast.html
vis.binds.chromecast = {
    version: "0.2.0",
    showVersion: function () {
        if (vis.binds.chromecast.version) {
            console.log('Version chromecast: ' + vis.binds.chromecast.version);
            vis.binds.chromecast.version = null;
        }
    },

    ChromecastDevice: {
        init: function(widgetID, view, data, style){
            var $div = $('#' + widgetID);
            // if nothing found => wait
            if (!$div.length) {
                return setTimeout(function () {
                    vis.binds.chromecast.ChromecastDevice.init(widgetID, view, data, style);
                }, 100);
            }
            
            $div.append('<select class="chromecastDeviceSelector"/>');
            var $select = $div.find('select.chromecastDeviceSelector');
            for (var devIndex=1; devIndex <= data.nDevs; devIndex++){
                var validDevId = undefined;
                try {
                    validDevId = getValidDevId(data["oid_dev_"+devIndex]);                
                } catch (e){};
                
                if (validDevId){
                    //Create selection
                    var name = validDevId.split(".")[2];
                    $select.append('<option value="'+devIndex+'">'+name+'</option>');

                    //Create div
                    console.log("creating "+validDevId);
                    $div.append('<div class="chromecastDevice_'+devIndex+'"/>');
                    var $device = $div.find('.chromecastDevice_'+devIndex);
                    $device.hide();

                    //Connected
                    $device.append('<input class="chromecastConnected" type="checkbox"/>Connected</br>');
                    registerForDeviceUpdates($device.find('input.chromecastConnected'), data["oid_connected_"+devIndex]);

                    //Volume
                    $device.append('<input class="chromecastVolume" type="range" min="0" max="100" />Volume</br>');
                    registerForDeviceUpdates($device.find('input.chromecastVolume'), data["oid_volume_"+devIndex]);

                    //Muted
                    $device.append('<input class="chromecastMuted" type="checkbox"/>Muted</br>');
                    registerForDeviceUpdates($device.find('input.chromecastMuted'), data["oid_muted_"+devIndex]);

                    //Playing
                    $device.append('<input class="chromecastPlaying" type="checkbox"/>Playing</br>');
                    registerForDeviceUpdates($device.find('.chromecastPlaying'), data["oid_playing_"+devIndex]);

                    //Paused
                    $device.append('<input class="chromecastPaused" type="checkbox"/>Paused</br>');
                    registerForDeviceUpdates($device.find('.chromecastPaused'), data["oid_paused_"+devIndex]);

                    //url2play
                    $device.append('<input class="chromecastUrl2play" type="text"/>url2play</br>');
                    registerForDeviceUpdates($device.find('.chromecastUrl2play'), data["oid_url2play_"+devIndex]);                  
                    
                    //display name
                    $device.append('<textarea class="chromecastDisplayName" readonly rows=1/></br>');
                    registerForDeviceUpdates($device.find('.chromecastDisplayName'), data["oid_displayName_"+devIndex]);
                    
                    //Player Description
                    $device.append('<textarea class="chromecastPlayerDescription" readonly rows=1/></br>');
                    registerForDeviceUpdates($device.find('.chromecastPlayerDescription'), data["oid_statusText_"+devIndex]);
                    
                    //player state
                    $device.append('<textarea class="chromecastPlayerState" readonly rows=1/>status</br>');
                    registerForDeviceUpdates($device.find('.chromecastPlayerState'), data["oid_playerState_"+devIndex]);
                    
                    //Playing URL
                    $device.append('<textarea class="chromecastPlayerURL" readonly rows=1/>Playing URL</br>');
                    registerForDeviceUpdates($device.find('.chromecastPlayerURL'), data["oid_url_"+devIndex]);
                    
                    //Title
                    $device.append('<textarea class="chromecastMetadataTitle" readonly rows=1/>title</br>');
                    registerForDeviceUpdates($device.find('.chromecastMetadataTitle'), data["oid_title_"+devIndex]);
                };
            };

            var currentSelection = data.selDev;
            $select.change(function(){
                
                var $device_old = $div.find('div.chromecastDevice_'+currentSelection);
                var $device_new = $div.find('div.chromecastDevice_'+$select.val());
                
                $device_old.hide();
                $device_new.show();
                
                currentSelection = $select.val();
            });
            $select.val(data.selDev).change();            
        },    
    },
    oid_changed: function(widgetID, view, newId, attr, isCss){
        var mods = [];

        //We just got the widgetID and the view -> find and
        //call this function for all oid_dev_*
        var nDevs = vis.views[view].widgets[widgetID].data.nDevs;            
        for (var index=1; index <= nDevs; index++) {
            attr  = "oid_dev_"+index;
            newId = vis.views[view].widgets[widgetID].data[attr];
            mods += oid_dev_changed(widgetID, view, newId, attr, isCss);
        }
        return mods;
    }
};

function oid_dev_changed(widgetID, view, newId, attr, isCss){
    var oid2State = {
            "oid_connected_"   : "status.connected",
            "oid_volume_"      : "status.volume",
            "oid_muted_"       : "status.muted",
            "oid_playing_"     : "status.playing",
            "oid_paused_"      : "player.paused",
            "oid_url2play_"    : "player.url2play",
            "oid_playerState_" : "player.playerState",
            "oid_title_"       : "metadata.title",
            "oid_url_"         : "media.contentId",
            "oid_displayName_" : "status.displayName",
            "oid_statusText_"  : "status.text"
    };

    var mods = [];
    if (!attr){
        //We just got the widgetID and the view -> find and
        //call this function for all oid_dev_*
        var nDevs = vis.views[view].widgets[widgetID].data.nDevs;            
        for (var index=1; index <= nDevs; index++) {
            attr  = "oid_dev_"+index;
            newId = vis.views[view].widgets[widgetID].data[attr];
            mods += oid_dev_changed(widgetID, view, newId, attr, isCss);
        }
        return mods;
    }

    //Get device index
    var index = attr.split("_")[2];

    //This is not the oid_dev -> look for the corresponding oid_dev and
    //call this function with it
    if (attr.indexOf("oid_dev_") < 0) {
        attr = "oid_dev_"+index;
        newId = vis.views[view].widgets[widgetID].data["oid_dev_"+index]
        return vis.binds.chromecast.oid_dev_changed(widgetID, view, newId, attr, isCss)
    }

    var validDevId = getValidDevId(newId);
    if (validDevId){
        //Set device id
        vis.views[view].widgets[widgetID].data[attr] = validDevId;
        mods.push(attr);
        //Set derived props
        for (var oid in oid2State) {
            vis.views[view].widgets[widgetID].data[oid+index] =
                validDevId+"."+oid2State[oid];
            mods.push(oid+index);
        }

    } else {
        //Reset derived props
        for (var oid in oid2State) {
            vis.views[view].widgets[widgetID].data[oid+index] = undefined;
            mods.push(oid+index);
        }
    }
    return mods;        
}


vis.binds.chromecast.showVersion();