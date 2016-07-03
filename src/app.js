/**
 * Initial Home Assistant interface for Pebble.
 *
 * By texnofobix (Dustin S.)
 */
console.log('WHA started!');

var confVersion = '0.2.0';

var UI = require('ui');
//var Vector2 = require('vector2');
var ajax = require('ajax');
var Settings = require('settings');

// Set a configurable with just the close callback
Settings.config(
  { url: 'http://dustin.souers.org/pebble/WristHA-' + confVersion + '.htm' },
  function(e) {
    console.log('closed configurable');

    // Show the parsed response
    console.log('returned_settings: ' + JSON.stringify(e.options));
    //ha_url = e.options.haurl;
    //ha_password = e.options.pwd;
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
var baseheaders = {'x-ha-access': ha_password};

console.log('ha_url: ' + baseurl);

// Initial screen
var main = new UI.Card({
  title: 'Wrist Home Assistant v0.2.1',
  subtitle: 'Loading ...',
});

// Set Menu colors
var menu = new UI.Menu({
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
        var x = a[key]; var y = b[key];
        if (way === '123' ) { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
        if (way === '321') { return ((x > y) ? -1 : ((x < y) ? 1 : 0)); }
    });
}

// gets HA device states
function getstates() {
  menu.section(0).title = 'WHA - updating ...';
  menu.show();
  main.hide();
  
  ajax(
    { url: baseurl + '/states', type: 'json', headers: baseheaders },
    function(data) {
      console.log('HA States: ' + data);
      console.log('WHA: upload title');
      menu.section(0).title = 'WHA';
      data = sortJSON(data,'last_changed', '321'); // 123 or 321
      //data.forEach(displayItem);
      var arrayLength = data.length;
      var menuIndex = 0;
      for (var i = 0; i < arrayLength; i++) {
        if (data[i].attributes.hidden)
        {
          //  
        } else {
          menu.item(0, menuIndex, { title: data[i].attributes.friendly_name, subtitle: data[i].state });
          menuIndex++;
        }
      }
   
    },
    function(error, status, request) {
      console.log('HA States failed: ' + error + ' status: ' + status);
      menu.section(0).title = 'WHA - failed updating';
      //main.subtitle('HA State load failed')
      //menu.hide();
      //main.show();
    }
  );
} 

// show main screen
main.show();

// get API status
ajax({ url: baseurl + '/', type: 'json', headers: baseheaders },
  function(data) {
    //card.body(data.contents.quote);
    //.title(data.contents.author);
    console.log('HA Status: ' + data);
    main.subtitle(data.message);
    //on success call states?
    getstates();
    
  },
  function(error, status, request) {
    console.log('HA Status failed: ' + error + ' status: ' + status);
    main.subtitle('Unable to connect: ' + error + ' status: ' + status);
  }
);

/*
Expiremental reload
*/
if (ha_refreshTime < 1 || typeof ha_refreshTime == "undefined") 
  {
    ha_refreshTime = 15;
  }
var counter = 0;
var timerID = setInterval(clock, 60000 * ha_refreshTime);

function clock() {
  counter = counter + 1;
  console.log('WHA Reload' + counter);
  getstates();
}
