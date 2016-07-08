/**
 * Initial Home Assistant interface for Pebble.
 *
 * By texnofobix (Dustin S.)
 */
console.log('WHA started!');

var appVersion = '0.3.1';
var confVersion = '0.2.0';

var UI = require('ui');
//var Vector2 = require('vector2');
var ajax = require('ajax');
var Settings = require('settings');
//var Timeline = require('timeline');
//var Vibe = require('ui/vibe');

console.log('WHA AccountToken:' + Pebble.getAccountToken());
console.log('WHA TimelineToken:' + Pebble.getTimelineToken());

// Set a configurable with just the close callback
Settings.config({
    url: 'http://dustin.souers.org/pebble/WristHA-' + confVersion + '.htm'
  },
  function(e) {
    console.log('closed configurable');

    // Show the parsed response
    console.log('returned_settings: ' + JSON.stringify(e.options));
    Settings.option(e.options);

    // Show the raw response if parsing failed
    if (e.failed) {
      console.log(e.response);
    }
  }
);

// Set some variables for quicker access
var ha_url = Settings.option('haurl');
var ha_password = Settings.option('pwd');
var ha_refreshTime = Settings.option('refreshTime');

var baseurl = ha_url + '/api';
var baseheaders = {
  'x-ha-access': ha_password
};

var device_status;

console.log('ha_url: ' + baseurl);

// Initial screen
var main = new UI.Card({
  title: 'Wrist Home Assistant v' + appVersion,
  subtitle: 'Loading ...',
});

// Set Menu colors
var statusMenu = new UI.Menu({
  backgroundColor: 'black',
  textColor: 'white',
  highlightBackgroundColor: 'white',
  highlightTextColor: 'black',
  sections: [{
    title: 'WHA'
  }]
});


//from http://stackoverflow.com/questions/881510/sorting-json-by-values
function sortJSON(data, key, way) {
  return data.sort(function(a, b) {
    var x = a[key];
    var y = b[key];
    if (way === '123') {
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    }
    if (way === '321') {
      return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    }
  });
}

// gets HA device states
function getstates() {
  statusMenu.section(0).title = 'WHA - updating ...';
  statusMenu.show();
  main.hide();

  ajax({
      url: baseurl + '/states',
      type: 'json',
      headers: baseheaders
    },
    function(data) {
      console.log('HA States: ' + data);
      console.log('WHA: upload title');
      statusMenu.section(0).title = 'WHA';
      var now = new Date();
      data = sortJSON(data, 'last_changed', '321'); // 123 or 321
      device_status = data;
      var arrayLength = data.length;
      var menuIndex = 0;
      for (var i = 0; i < arrayLength; i++) {
        if (data[i].attributes.hidden) {
          //  
        } else {
          statusMenu.item(0, menuIndex, {
            title: data[i].attributes.friendly_name,
            subtitle: data[i].state + ' ' + humanDiff(now, new Date(data[i].last_changed))
          });
          menuIndex++;
        }
      }
      //Vibe.vibrate('short');
    },
    function(error, status, request) {
      console.log('HA States failed: ' + error + ' status: ' + status);
      statusMenu.section(0).title = 'WHA - failed updating';
    }
  );
}

function testApi() {
  // get API status
  ajax({
      url: baseurl + '/',
      type: 'json',
      headers: baseheaders
    },
    function(data) {
      console.log('HA Status: ' + data);
      main.subtitle(data.message);
      //on success call states?
      getstates();

    },
    function(error, status, request) {
      console.log('HA Status failed: ' + error + ' status: ' + status);
      main.subtitle('Error!');
      main.body(error + ' status: ' + status);
    }
  );
}

/*
Expiremental reload
*/
if (ha_refreshTime < 1 || typeof ha_refreshTime == "undefined") {
  ha_refreshTime = 15;
}
var counter = 0;
var timerID = setInterval(clock, 60000 * ha_refreshTime);

function clock() {
  counter = counter + 1;
  console.log('WHA Reload' + counter);
  getstates();
}

// Add an action for SELECT
statusMenu.on('select', function(e) {
  console.log('Item number ' + e.itemIndex + ' was short pressed!');
  var friendlyName = device_status[e.itemIndex].attributes.friendly_name;
  console.log('Friendly: ' + friendlyName);
  //var thisDevice = device_status.find(x=> x.attributes.friendly_name == friendlyName);
  var thisDevice = device_status.filter(function(v) { return v.attributes.friendly_name == friendlyName; })[0];
  console.log('thisDevice: ' + JSON.stringify(thisDevice));
  //POST /api/services/<domain>/<service>
  //get available servcies /api/services 
});

// Add an action for LONGSELECT
statusMenu.on('longSelect', function(e) {
  console.log('Item number ' + e.itemIndex + ' was long pressed!');
});

function humanDiff(newestDate, oldestDate) {
  var prettyDate = {
    diffDate: newestDate - oldestDate,
    diffUnit: "ms"
  };

  function reduceNumbers(inPrettyDate, interval, unit) {
    if (inPrettyDate.diffDate > interval) {
      inPrettyDate.diffDate = inPrettyDate.diffDate / interval;
      inPrettyDate.diffUnit = unit;
    }
    return inPrettyDate;
  }

  prettyDate = reduceNumbers(prettyDate, 1000, 's');
  prettyDate = reduceNumbers(prettyDate, 60, 'm');
  prettyDate = reduceNumbers(prettyDate, 60, 'h');
  prettyDate = reduceNumbers(prettyDate, 24, 'd');
  return '> ' + Math.round(prettyDate.diffDate, 0) + ' ' + prettyDate.diffUnit;
}


// show main screen
main.show();
testApi();
