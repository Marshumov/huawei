const fs = require('fs');
const { parse } = require('json2csv');
const axios = require('axios');
var convert = require('xml-js');
const { transform, prettyPrint } = require('camaro')
const timeChange = 600000;
let type = '';

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
let ip = '';
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
//  console.log("Проверка статуса monitoringInfo");
  //console.log('token', token);
  axios.defaults.headers.common['__RequestVerificationToken'] = token[0].token;
  await axios.get('http://192.168.8.1/api/monitoring/status')
  .then( function (response) {
      statusInfo =  response.data
//      console.log("Проверка статуса monitoringInfo, statusInfo  = " + statusInfo);
  })
  .catch(function (error) {
    console.log(error);
  })
  .then(function (result) {
  });
}
async function onLTE() {
  //console.log('Запускаю LTE');
  await updateToken();
  let resultToken = await transform(token, tokenSchema)
  axios.defaults.headers.common['__RequestVerificationToken'] = resultToken[0].token;
  await axios.post('http://192.168.8.1/api/net/net-mode', lteXML)
    .then(async function (response) {
    //  console.log('LTE активирован, идет смена на 3g, ждем 10 сек');
      setTimeout(async ()=> { changeTimeActiveted('lte')}, 6000)
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
}
 async function checkIP() {
   await axios.get('https://marshumovglass.com/ip.php')
  .then(async function (response) {
    ip = response.data.ip;
  })
  .catch(function (error) {
    console.log(error);
  })
  .then(function() {

  });
}
console.log(checkIP());
async function on3g() {
//  console.log('Запускаю 3g');
  await updateToken();
  let resultToken = await transform(token, tokenSchema)
  axios.defaults.headers.common['__RequestVerificationToken'] = resultToken[0].token;
  await axios.post('http://192.168.8.1/api/net/net-mode', hspaXML)
    .then(async function (response) {
    //  console.log('3g активирован, идет смена на LTE, ждем 10 сек');
      setTimeout(async ()=> { changeTimeActiveted('hspa')}, 6000)

    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
}
async function changeTimeActiveted(typeInternet) {
//  console.log('changeTimeActiveted');
  if (typeof typeInternet != undefined) {
      type = typeInternet;
  }
  else typeInternet = type;
  await updateToken();
  let resultToken = await transform(token, tokenSchema)
  await monitoringInfo(resultToken);
  //console.log("Парсинг статус инфо", statusInfo);
  let result =  await transform(statusInfo, monitoringSchema)
//  console.log("statusInfo = ", result[0]);
  if (result[0].connectionstatus==901) {
    //console.log('result.connectionstatus==901');
    if (typeInternet=='lte') {
      console.log('Начинается новый цикл LTE');
      await checkIP();
      console.log('Новый ip адрес: ' + ip);
      setTimeout(on3g, timeChange)
    }
    else if (typeInternet=='hspa') {
      await onLTE(token)
    }
  }
  else if(result[0].connectionstatus==902) {
    //console.log('result.connectionstatus==902');
    waiting(typeInternet);
  }
}
function waiting (typeInternet) {
  //console.log('ждем 3 секунды для проверки статуса');
  setTimeout(async ()=> { changeTimeActiveted(typeInternet)}, 3000)
}

async function chengeIP(token) {
  //console.log('Начинаю менять ip');
  await monitoringInfo(token);
  let result =  await transform(statusInfo, monitoringSchema)
//  console.log('currentnetworktype', result[0].currentnetworktype);
  let currentnetworktype = result[0].currentnetworktype
//  console.log(currentnetworktype);
  if(currentnetworktype==41) {
    await onLTE(token);
  }
  else if(currentnetworktype==46) {
    await on3g(token);
  }
}

async function updateToken() {
  await getToken();
  let result = await transform(token, tokenSchema)
//  console.log('Происходит обновление токена', result);
}

;(async function () {
  // console.log('Старт программы');
   await checkIP();
   console.log('Ваш текущий ip: ' + ip);
   await getToken();
   let result = await transform(token, tokenSchema)
   chengeIP(result)
})()
