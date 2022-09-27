require('dotenv').config({ path: './test.env' });
const expect = require('chai').expect;

const SDK = require('../dist/index');

const HOST = process.env.DATA_STACK_HOST;
const USERNAME = process.env.DATA_STACK_USERNAME;
const PASSWORD = process.env.DATA_STACK_PASSWORD;


if (!HOST) {
    throw new Error('HOST is Required');
}
if (!USERNAME) {
    throw new Error('USERNAME is Required');
}
if (!PASSWORD) {
    throw new Error('PASSWORD is Required');
}


describe("Login Test", function () {
    it('Valid Login Test', async function () {
        const DataStack = await SDK.authenticateByCredentials({ host: HOST, username: USERNAME, password: PASSWORD });
        expect(DataStack).to.contain.keys(['authData']);
        expect(DataStack.authData).to.contain.keys(['token']);
        DataStack.Logout();
    });
    it('Invalid Login Test', async function () {
        try {
            const DataStack = await SDK.authenticateByCredentials({ host: HOST, username: USERNAME + '_invalid', password: PASSWORD });
            expect(DataStack).to.not.contain.keys(['authData']);
            DataStack.Logout();
        } catch (err) {
            expect(err.body).to.contain.keys('message');
            expect(err.body.message).to.equal('User not found.');
        }
    });
});