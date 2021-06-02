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

    const roles = dataService.getRoles();
    
    console.log(dataService);
  } catch (e) {
    console.error('ERROR !!');
    console.error(e);
  }
})();
