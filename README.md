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

## APIs

The SDK contains the following apis.

<hr>

### authenticateByCredentials(credentials)

Returns a Promise giving a [DataStack object](#DataStack).

#### credentials

Type: `Credentials`

##### host

Type `string`

The FQDN of the application.

##### username

Type `string`

The Username of a user / Client ID of Bot.

##### password

Type `string`

The Password of a user / API key of Bot.

<hr>

### authenticateByToken(credentials)

Returns a Promise giving a [DataStack object](#DataStack).

#### credentials

Type: `Credentials`

##### host

Type `string`

The FQDN of the application

##### token

Type `string`

The JWT token of a User / Bot

<hr>

### DataStack

The object contains utility methods to access DataStack.

#### App(name)

Returns a Promise giving a [DSApp object](#DSApp).

##### name

Type: `string`

The name of the App

#### ListApps()

Returns a Promise giving a [DSApp array](#DSApp).

<hr>

### DSApp

The object contains utility methods to access an App of Data Stack.

#### DataService(name)

Returns a Promise giving a [DSDataService object](#DSDataService).

##### name

Type: `string`

The name/id of the Data Service

#### ListDataServices()

Returns a Promise giving a [DSDataService array](#DSDataService).

<hr>

### DSDataService

The object contains utility methods to manage a Data Service.

#### CRUD()

Returns an [CRUDMethods object](#CRUDMethods) to do CRUD operations that Data Service.

#### Start()

Returns a Promise giving a [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

This will start the Data Service if not already running.

#### Stop()

Returns a Promise giving a [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

This will stop the Data Service if not already stopped.

#### Repair()

Returns a Promise giving a [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

This will re-deploy the Data Service in the infra layer by re-creating it's service and deployment.

#### getIntegrations()

Returns an [DSDataServiceIntegration object](#DSDataServiceIntegration) to do manage integrations of Data Service.

#### setIntegrations(data)

Returns a Promise giving a [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### data

Type: `DSDataServiceIntegration`

After making changes to the returned object by [getIntegrations()](<#getIntegrations()>) method set that object here in order for the change to be applied.

#### getRoles()

Returns an [DSDataServiceRole object](#DSDataServiceRole) to do manage Roles of Data Service.

#### setRoles(data)

Returns a Promise giving a [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### data

Type: `DSDataServiceRole`

After making changes to the returned object by [getRoles()](<#getRoles()>) method set that object here in order for the change to be applied.

#### getSchema()

Returns an [DSDataServiceSchema object](#DSDataServiceSchema) to do manage Schema of Data Service.

#### setSchema(data)

Returns a Promise giving a [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### data

Type: `DSDataServiceSchema`

After making changes to the returned object by [getSchema()](<#getSchema()>) method set that object here in order for the change to be applied.

<hr>

### DSDataServiceIntegration

#### listPreHook(): WebHook[]

Returns a [WebHook array](#WebHook) or empty `[]` if not hooks present.

#### getPreHook(name: string): WebHook | undefined

Returns a [WebHook Object](#WebHook) or `undefined` if not found.

##### name

Type: `string`

The Name of the hook that is needed.

#### addPreHook(data: WebHook): DSDataServiceIntegration

Returns a [DSDataServiceIntegration Object](#DSDataServiceIntegration) for chaning of apis.

##### data

Type: `WebHook`

#### removePreHook(name: string): DSDataServiceIntegration

Returns a [DSDataServiceIntegration Object](#DSDataServiceIntegration) for chaning of apis.

##### name

Type: `string`

The Name of the hook that needs to be removed.

#### listPostHook(): WebHook[]

Returns a [WebHook array](#WebHook) or empty `[]` if not hooks present.

#### getPostHook(name: string): WebHook | undefined

Returns a [WebHook Object](#WebHook) or `undefined` if not found.

##### name

Type: `string`

The Name of the hook that is needed.

#### addPostHook(data: WebHook): DSDataServiceIntegration

Returns a [DSDataServiceIntegration Object](#DSDataServiceIntegration) for chaning of apis.

##### data

Type: `WebHook`

#### removePostHook(name: string): DSDataServiceIntegration

Returns a [DSDataServiceIntegration Object](#DSDataServiceIntegration) for chaning of apis.

##### name

Type: `string`

The Name of the hook that needs to be removed.

<hr>

### DSDataServiceRole

#### listRoles(): RoleBlock[]

Returns [RoleBlock array](#RoleBlock)

#### getRole(name: string): RoleBlock | undefined

Returns [RoleBlock object](#RoleBlock) or undefined if no roles found.

##### name

Type: `string`

The Name of the role that is needed.

#### createNewRole(name: string, description?: string): RoleBlock

Returns a new [RoleBlock object](#RoleBlock) that should be used to add more roles.

##### name

Type: `string`

The Name of the new role.

#### addRole(data: RoleBlock): DSDataServiceRole

Returns [DSDataServiceRole object](#DSDataServiceRole) to continue api chaning.

##### data

Type: `RoleBlock`

The RoleBlock Object that was returned by `createNewRole()` method.

#### removeRole(name: string): DSDataServiceRole

Returns [DSDataServiceRole object](#DSDataServiceRole) to continue api chaning.

##### name

Type: `string`

The Name of the role that needs to be removed.

<hr>

### DSDataServiceSchema

<hr>

### ErrorResponse

The object is return whenever some error occurs.

#### statusCode

Type: `number`

The status code returned by the application.

#### body

Type: `object`

The response body send by the application in case if error.

#### message

Type: `string`

The error message if the error occured in the SDK.

<hr>

### WebHook

The Object used by pre-hooks and post-hooks.

#### name

Type: `string`

A unique name of the hook.

#### url

Type: `string`

A URL of the Web-Hook.

#### failMessage

Type: `string`

Optional error message to show, when the hook URL is down.

<hr>

### ENV Variables

The Credentials/Token can also be set via ENV.

| ENV Variables       | Description                      |
| ------------------- | -------------------------------- |
| DATA_STACK_HOST     | The FQDN of Data Stack           |
| DATA_STACK_USERNAME | Username / Client ID of Bot      |
| DATA_STACK_PASSWORD | User's Password / API Key of Bot |
| DATA_STACK_TOKEN    | The existing JWT token           |
