const fs = require('fs');
const path = require('path');
require('dotenv').config();
const SDK = require('./dist/index');

const HOST = process.env.DATA_STACK_HOST;
const USERNAME = process.env.DATA_STACK_USERNAME;
const PASSWORD = process.env.DATA_STACK_PASSWORD;
const TOKEN = process.env.DATA_STACK_TOKEN;

(async function () {
  try {
    let dataStack = await SDK.authenticateByCredentials({
      host: HOST,
      username: USERNAME,
      password: PASSWORD,
      // token: TOKEN
    });
    console.log('Valid Token');
    const app = await dataStack.App('Jugnu');
    const dataService = await app.DataService('secure-test');
    const yaml = await dataService.Yamls();
    yaml.writeToStream(fs.createWriteStream(path.join(__dirname,'test-files','test.yaml')));
    // const file = await dataService.DataAPIs().UploadFileFromPath(path.join(__dirname,'test.txt'));
    console.log(yaml);
    // const status = await app.StartAllDataServices();
    // let dataService = await app.DataService('Employee');
    // const math = dataService.DataAPIs().PrepareMath();
    // math.SelectField('salary').Increment(5000).Multiply(1.2);
    // console.log(math.CreatePayload());
    // const record = await dataService.DataAPIs().ApplyMath('USE1003', math);
    // console.log(record);
  } catch (e) {
    console.error('ERROR !!');
    console.error(e);
  }
})();
