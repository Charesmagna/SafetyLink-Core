cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-plugin-sms.SMS",
      "file": "plugins/cordova-plugin-sms/www/SMS.js",
      "pluginId": "cordova-plugin-sms",
      "clobbers": [
        "window.SMS"
      ]
    },
    {
      "id": "cordova-plugin-geolocation.geolocation",
      "file": "plugins/cordova-plugin-geolocation/www/android/geolocation.js",
      "pluginId": "cordova-plugin-geolocation",
      "clobbers": [
        "navigator.geolocation"
      ]
    },
    {
      "id": "cordova-plugin-geolocation.PositionError",
      "file": "plugins/cordova-plugin-geolocation/www/PositionError.js",
      "pluginId": "cordova-plugin-geolocation",
      "runs": true
    },
    {
      "id": "mx.ferreyra.callnumber.CallNumber",
      "file": "plugins/mx.ferreyra.callnumber/www/CallNumber.js",
      "pluginId": "mx.ferreyra.callnumber",
      "clobbers": [
        "call"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-sms": "1.0.5",
    "cordova-plugin-geolocation": "5.0.0",
    "mx.ferreyra.callnumber": "0.0.2"
  };
});