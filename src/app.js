/**
 * Initial Home Assistant interface for Pebble.
 *
 * By Dustin Souers
 */

var confVersion = '0.1.3';

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

var ha_url = Settings.option('haurl');
var ha_password = Settings.option('pwd');

var baseurl = ha_url + '/api';
var baseheaders = {'x-ha-access': ha_password};

console.log('ha_url: ' + baseurl);

var main = new UI.Card({
  title: 'Wrist Home Assistant',
  subtitle: 'Loading ...',
});

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

function getstates() {
  ajax(
    { url: baseurl + '/states', type: 'json', headers: baseheaders },
    function(data) {
      console.log('HA States: ' + data);
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
      menu.show();
    },
    function(error, status, request) {
      console.log('HA States failed: ' + error + ' status: ' + status);
    }
  );
} 

main.show();

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
  }
);