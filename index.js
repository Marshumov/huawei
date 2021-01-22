const fs = require('fs');
const { parse } = require('json2csv');
const axios = require('axios');
var convert = require('xml-js');
const { transform, prettyPrint } = require('camaro')
const xml =
'<?xml version="1.0" encoding="utf-8"?>' +
'<request><dataswitch>' +
'1' +
'</dataswitch></request>';
const xml2 =
'<?xml version: "1.0" encoding="UTF-8"?><request><Action>1</Action></request>';
const xml3 = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><request><Control>1</Control></request>";

const lteXML = '<?xml version: "1.0" encoding="UTF-8"?><request><NetworkMode>03</NetworkMode><NetworkBand>3FFFFFFF</NetworkBand><LTEBand>800C5</LTEBand></request>';
const hspaXML = '<?xml version: "1.0" encoding="UTF-8"?><request><NetworkMode>02</NetworkMode><NetworkBand>3FFFFFFF</NetworkBand><LTEBand>800C5</LTEBand></request>';

let token = '';
let statusInfo = '';
async function getToken() {
  await axios.get('http://192.168.8.1/api/webserver/token')
  .then(function (response) {
  //  console.log(response.data);
     token =  response.data;
    // return response.data;
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .then(function () {
    // always executed
  });
}



const tokenSchema = ['response', {
    token: 'token',
}]
const infoMobileSchema = ['response', {
    productFamily: 'ProductFamily',
}]
const monitoringSchema = ['response', {
    wanipaddress: 'WanIPAddress',
    connectionstatus: 'ConnectionStatus',
    currentnetworktype: 'CurrentNetworkType'
}]
/*
function disconnect(token) {
  axios.defaults.headers.common['__RequestVerificationToken'] = token[0].token;

  axios.post('http://192.168.8.1/api/dialup/mobile-dataswitch', xml)
      .then(function (response) {
        console.log(response.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });
  axios.post('http://192.168.8.1/api/dialup/dial', xml2)
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
    axios.post('http://192.168.8.1/api/device/control', xml3)
      .then(function (response) {
        console.log(response.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });
}
async function deviceInfo(token) {
  axios.defaults.headers.common['__RequestVerificationToken'] = token[0].token;
  await axios.get('http://192.168.8.1/api/device/information')
  .then(function (response) {
    ;(async function () {
      const result = await transform(response.data, infoMobileSchema)
      console.log(result);
    })()
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .then(function () {
    // always executed
  });
}
*/
async function monitoringInfo(token) {
  axios.defaults.headers.common['__RequestVerificationToken'] = token[0].token;
  await axios.get('http://192.168.8.1/api/monitoring/status')
  .then(function (response) {
      statusInfo = response.data
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .then(function (result) {
    // always executed
  });
}
async function onLTE(token) {
  axios.defaults.headers.common['__RequestVerificationToken'] = token[0].token;
  await axios.post('http://192.168.8.1/api/net/net-mode', lteXML)
    .then(function (response) {
    //  const result = transform(response.data, infoMobileSchema)
      console.log(response.data);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
}
async function on3g(token) {
  axios.defaults.headers.common['__RequestVerificationToken'] = token[0].token;
  await axios.post('http://192.168.8.1/api/net/net-mode', hspaXML)
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
}
async function chengeIP(token) {
  await monitoringInfo(token);
  let result =  await transform(statusInfo, monitoringSchema)
  console.log(result);
//  await on3g(token);
//  await monitoringInfo(token);
//  await onLTE(token);
//  await deviceInfo(token);
}
function checkNotifications() {
  //http://192.168.8.1/api/monitoring/check-notifications
}
;(async function () {
//
   await getToken();
  //console.log('token', token);
   let result = await transform(token, tokenSchema)
  //     console.log(result)
//  await disconnect(result)
//  await deviceInfo(result)
  await chengeIP(result)
})()
