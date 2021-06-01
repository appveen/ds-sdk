# ds-sdk

The Official SDK for Data.Stack

## Setup

```sh
npm i --save @appveen/ds-sdk
```

```javascript
const SDK = require('@appveen/ds-sdk');
```

## Example 1
Authenticate using Credentials (Username/password)

```javascript
const SDK = require('@appveen/ds-sdk');
const HOST = 'https://cloud.appveen.com';
const USERNAME = 'johndoe@appveen.com';
const PASSWORD = 'johndoehasapassword';

(async function () {
  try {
    const dataStack = await SDK.authenticateByCredentials({
      host: HOST,
      username: USERNAME,
      password: PASSWORD,
    });

    const app = await dataStack.App('Adam');
    const dataService = await app.DataService('Employee');
    const record = await dataService.CRUD().Get('EMP1001');

    console.log(record);
  } catch (e) {
    console.error(e);
  }
})();
```

## Example 2
Authenticate using JWT Token

```javascript
const SDK = require('@appveen/ds-sdk');
const HOST = 'https://cloud.appveen.com';
const TOKEN = 'dgdoieruyiueyr794iryewyrye7rbyewr';

(async function () {
  try {
    const dataStack = await SDK.authenticateByToken({
      host: HOST,
      token: TOKEN,
    });

    const app = await dataStack.App('Adam');
    const dataService = await app.DataService('Employee');
    const record = await dataService.CRUD().Get('EMP1001');

    console.log(record);
  } catch (e) {
    console.error(e);
  }
})();
```

### ENV Variables

The Credentials/Token can also be set via ENV.

| ENV Variables  | Description   |
| -------------  |-------------|
| DATA_STACK_HOST| The FQDN of Data Stack  |
| DATA_STACK_USERNAME| Username / Client ID of Bot     |
| DATA_STACK_PASSWORD| User's Password / API Key of Bot  |
| DATA_STACK_TOKEN| The existing JWT token |
