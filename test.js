require('dotenv').config();
const SDK = require('./dist/index');

const HOST = process.env.DATA_STACK_HOST;
const USERNAME = process.env.DATA_STACK_USERNAME;
const PASSWORD = process.env.DATA_STACK_PASSWORD;

(async function () {
    try {
        const dataStack = await SDK.authenticateByCredentials({
            host:HOST,
            username: USERNAME,
            password: PASSWORD
        });

        const app = await dataStack.App('Jugnu');
        const dataService = await app.DataService('User');
        // const status = await dataService.Repair();
        const records = await dataService.CRUD().List();

        dataStack = null;
        app = null;
        dataService = null;
        records = null;
        
        // console.log(status)
        console.log(records);
    } catch (e) {
        console.error('ERROR !!');
        console.error(e);
    }
})();

