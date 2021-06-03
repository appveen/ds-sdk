require('dotenv').config();
const SDK = require('./dist/index');

const HOST = process.env.DATA_STACK_HOST;
const USERNAME = process.env.DATA_STACK_USERNAME;
const PASSWORD = process.env.DATA_STACK_PASSWORD;

(async function () {
  try {
    let dataStack = await SDK.authenticateByCredentials({
      host: HOST,
      username: USERNAME,
      password: PASSWORD,
    });

    let app = await dataStack.App('Jugnu');
    let dataService = await app.DataService('User');
    const math = dataService.DataAPIs().DoMath();
    math.SelectField('amount').Increment(-100).SelectField('balance').Multiply(10).Increment(434);
    dataService.DataAPIs().ApplyMath('', math);
    console.log(math.CreatePayload());
  } catch (e) {
    console.error('ERROR !!');
    console.error(e);
  }
})();
