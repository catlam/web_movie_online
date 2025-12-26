// scripts/momo_create_sample.cjs  (CommonJS)
const crypto = require('crypto');
const https = require('https');

var accessKey = 'F8BBA842ECF85';
var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
var orderInfo = 'pay with MoMo';
var partnerCode = 'MOMO';
var redirectUrl = 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b';
var ipnUrl = 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b';
var requestType = 'payWithMethod'; // đúng theo doc
var amount = '50000';
var orderId = partnerCode + new Date().getTime();
var requestId = orderId;
var extraData = '';
var orderGroupId = '';
var autoCapture = true;
var lang = 'vi';

// rawSignature theo doc
var rawSignature = 'accessKey=' + accessKey
    + '&amount=' + amount
    + '&extraData=' + extraData
    + '&ipnUrl=' + ipnUrl
    + '&orderId=' + orderId
    + '&orderInfo=' + orderInfo
    + '&partnerCode=' + partnerCode
    + '&redirectUrl=' + redirectUrl
    + '&requestId=' + requestId
    + '&requestType=' + requestType;

var signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

const requestBody = JSON.stringify({
    partnerCode: partnerCode,
    partnerName: 'Test',
    storeId: 'MomoTestStore',
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: redirectUrl,
    ipnUrl: ipnUrl,
    lang: lang,
    requestType: requestType,
    autoCapture: autoCapture,
    extraData: extraData,
    orderGroupId: orderGroupId,
    signature: signature
});

const options = {
    hostname: 'test-payment.momo.vn',
    port: 443,
    path: '/v2/gateway/api/create',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(requestBody) }
};

const req = https.request(options, res => {
    console.log(`Status: ${res.statusCode}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => { console.log('Body:', body); });
});
req.on('error', e => console.log('request error:', e.message));
req.write(requestBody);
req.end();
