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
    const record = await dataService.DataAPIs().GetRecord('EMP1001');

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
    const record = await dataService.DataAPIs().GetRecord('EMP1001');

    console.log(record);
  } catch (e) {
    console.error(e);
  }
})();
```

## Example 3

Using Math API

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
    const math = dataService.DataAPIs().PrepareMath();
    math.SelectField('salary').Multiply(1.2); // Increment Salary by 20%
    const updatedRecord = await dataService.DataAPIs().ApplyMath('EMP1001', math);

    console.log(updatedRecord);
  } catch (e) {
    console.error(e);
  }
})();
```

## APIs

The SDK contains the following apis.

<hr>

### **authenticateByCredentials(credentials)**

Returns a Promise giving a [DataStack object](#DataStack).

#### **credentials**

Type: `Credentials`

##### **_host_**

Type `string`

The FQDN of the application.

##### **_username_**

Type `string`

The Username of a user / Client ID of Bot.

##### **_password_**

Type `string`

The Password of a user / API key of Bot.

##### **_trace_**

Type `boolean`

If `True` it will log all SDK events. `Default: false`


##### **_logger_**

Type `Logger`

To pass a custom logger for logging events and errors

<hr>

### **authenticateByToken(credentials)**

Returns a Promise giving a [DataStack object](#DataStack).

#### credentials

Type: `Credentials`

##### **_host_**

Type `string`

The FQDN of the application

##### **_token_**

Type `string`

The JWT token of a User / Bot

##### **_trace_**

Type `boolean`

If `True` it will log all SDK events. `Default: false`


##### **_logger_**

Type `Logger`

To pass a custom logger for logging events and errors

<hr>

### **DataStack**

The object contains utility methods to access DataStack.


#### **Logout()**

Returns a Void Promise.

#### **App(name)**

Returns a Promise giving a [DSApp object](#DSApp).

##### **_name_**

Type: `string`

The name of the App

#### **ListApps()**

Returns a Promise giving a [DSApp array](#DSApp).

#### **CreateApp(name: string)**

Returns a Promise giving a [DSApp object](#DSApp).

##### **_name_**

Type: `string`

The name of the App

#### **DeleteApp(name: string)**

Returns a Promise giving the same [DataStack object](#DataStack).

##### **_name_**

Type: `string`

The name of the App

<hr>

### **DSApp**

The object contains utility methods to access an App of Data Stack.

#### **DataService(name)**

Returns a Promise giving a [DSDataService object](#DSDataService).

##### **_name_**

Type: `string`

The name of the Data Service.

#### **ListDataServices()**

Returns a Promise giving a [DSDataService array](#DSDataService).

#### **CreateDataService(name)**

Returns a Promise giving a [DSDataService object](#DSDataService).

##### **_name_**

Type: `string`

The name/id of the Data Service to be Created.

#### **StartAllDataServices()**

Returns a Promise giving the same [DSApp object](#DSApp), else will throw an [ErrorResponse object](#ErrorResponse).

This will start all the Data Service in the app, if not already stopped.

#### **StopAllDataServices()**

Returns a Promise giving the same [DSApp object](#DSApp), else will throw an [ErrorResponse object](#ErrorResponse).

This will stop all the Data Service in the app, if not already stopped.

<hr>

### **DSDataService**

The object contains utility methods to manage a Data Service.

#### **HasDraft()**

Returns an `boolean` value.

#### **IsDraft()**

Returns an `boolean` value.


#### **SwitchToDraft()**

Returns the same [DSDataService object](#DSDataService).


#### **SwitchToOriginal()**

Returns the same [DSDataService object](#DSDataService).

#### **DiscardDraft()**

Returns a Promise giving the same [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

This will discard the draft version of this Data Service.

#### **purgeAllData()**

Returns a Promise giving the same [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

This will Delete all data, API logs and audit logs of this Data Service.

#### **PurgeApiLogs()**

Returns a Promise giving the same [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

This will Delete all API logs of this Data Service.

#### **PurgeAuditLogs()**

Returns a Promise giving the same [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

This will Delete all audit logs of this Data Service.

#### **Delete()**

Returns an [DSApp object](#DSApp).

This will delete the selected Data Service.

#### **DataAPIs()**

Returns an [DataMethods object](#DataMethods) to do Data operations that Data Service.

#### **Start()**

Returns a Promise giving the same [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

This will start the Data Service if not already running.

#### **Stop()**

Returns a Promise giving the same [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

This will stop the Data Service if not already stopped.

#### **Repair()**

Returns a Promise giving the same [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

This will re-deploy the Data Service in the infra layer by re-creating it's service and deployment.

#### **getIntegrations()**

Returns an [DSDataServiceIntegration object](#DSDataServiceIntegration) to do manage integrations of Data Service.

#### **setIntegrations(data)**

Returns a Promise giving the same [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### **_data_**

Type: `DSDataServiceIntegration`

After making changes to the returned object by [getIntegrations()](<#getIntegrations()>) method set that object here in order for the change to be applied.

#### **getRoles()**

Returns an [DSDataServiceRole object](#DSDataServiceRole) to do manage Roles of Data Service.

#### **setRoles(data)**

Returns a Promise giving the same [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### **_data_**

Type: `DSDataServiceRole`

After making changes to the returned object by [getRoles()](<#getRoles()>) method set that object here in order for the change to be applied.

#### **getSchema()**

Returns an [DSDataServiceSchema object](#DSDataServiceSchema) to do manage Schema of Data Service.

#### **setSchema(data)**

Returns a Promise giving the same [DSDataService object](#DSDataService) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### **_data_**

Type: `DSDataServiceSchema`

After making changes to the returned object by [getSchema()](<#getSchema()>) method set that object here in order for the change to be applied.

<hr>

### **DataMethods**

This Object contains methods to manage data of a Data Service.

#### **CountRecords(filter: object)**

Returns a Promise giving a `number` if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### **_filter_**

Type: `object` The filter get proper count.

#### **ListRecords(options: [ListOptions](#ListOptions))**

Returns a Promise giving a [DataStackDocument array](#DataStackDocument) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### **_options_**

Type: `ListOptions` The options to list records.

#### **GetRecord(id: string)**

Returns a Promise giving a [DataStackDocument object](#DataStackDocument) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### **_id_**

Type: `string` The ID of the record.

#### **UpdateRecord(id: string, data: object)**

Returns a Promise giving a [DataStackDocument object](#DataStackDocument) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### **_id_**

Type: `string` The ID of the record.

##### **_data_**

Type: `object` The data the should to be updated.

#### **UpsertRecord(id: string, data: object)**

Returns a Promise giving a [DataStackDocument object](#DataStackDocument) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### **_id_**

Type: `string` The ID of the record.

##### **_data_**

Type: `object` The data the should to be updated.

#### **CreateRecord(data: object)**

Returns a Promise giving a [DataStackDocument object](#DataStackDocument) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### **_data_**

Type: `object` The data the should to be created.

#### **DeleteRecord(id: string)**

Returns a Promise giving a message:`string` if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### **_id_**

Type: `string` The ID of the record.

#### **PrepareMath()**

Returns a [MathAPI object](#MathAPI) to set math operations.

#### **ApplyMath(id: string, math: [MathAPI](#MathAPI))**

Returns a Promise giving a [DataStackDocument object](#DataStackDocument) if the operation is success, else will throw an [ErrorResponse object](#ErrorResponse).

##### **_id_**

Type: `string` The ID of the record.

##### **_math_**

Type: `MathAPI` The Math Object that has the operations.

<hr>

### **MathAPI**

#### **SelectField(path: string): MathAPI;**

Selects the field to apply math operation.

Returns the same MathAPI Object to continue API chaning.

##### **_path_**

Type: `string`

Path of the Field.

#### **Increment(num: number): MathAPI;**

Increment the value to the selected field.

Returns the same MathAPI Object to continue API chaning.

##### **_num_**

Type: `number`

The value to increment. Give negative values to decrement.

#### **Multiply(num: number): MathAPI;**

Multiply the value to the selected field.

Returns the same MathAPI Object to continue API chaning.

##### **_num_**

Type: `number`

The value to multiply.

<hr>

### **DSDataServiceIntegration**

#### **listPreHook(): WebHook[]**

Returns a [WebHook array](#WebHook) or empty `[]` if not hooks present.

#### **getPreHook(name: string): WebHook | undefined**

Returns a [WebHook Object](#WebHook) or `undefined` if not found.

##### **_name_**

Type: `string`

The Name of the hook that is needed.

#### **addPreHook(data: WebHook): DSDataServiceIntegration**

Returns a [DSDataServiceIntegration Object](#DSDataServiceIntegration) for chaning of apis.

##### **_data_**

Type: `WebHook`

#### **removePreHook(name: string): DSDataServiceIntegration**

Returns a [DSDataServiceIntegration Object](#DSDataServiceIntegration) for chaning of apis.

##### **_name_**

Type: `string`

The Name of the hook that needs to be removed.

#### **listPostHook(): WebHook[]**

Returns a [WebHook array](#WebHook) or empty `[]` if not hooks present.

#### **getPostHook(name: string): WebHook | undefined**

Returns a [WebHook Object](#WebHook) or `undefined` if not found.

##### **_name_**

Type: `string`

The Name of the hook that is needed.

#### **addPostHook(data: WebHook): DSDataServiceIntegration**

Returns a [DSDataServiceIntegration Object](#DSDataServiceIntegration) for chaning of apis.

##### **_data_**

Type: `WebHook`

#### **removePostHook(name: string): DSDataServiceIntegration**

Returns a [DSDataServiceIntegration Object](#DSDataServiceIntegration) for chaning of apis.

##### **_name_**

Type: `string`

The Name of the hook that needs to be removed.

<hr>

### **DSDataServiceRole**

#### **listRoles(): RoleBlock[]**

Returns [RoleBlock array](#RoleBlock)

#### **getRole(name: string): RoleBlock | undefined**

Returns [RoleBlock object](#RoleBlock) or undefined if no roles found.

##### **_name_**

Type: `string`

The Name of the role that is needed.

#### **createNewRole(name: string, description?: string): RoleBlock**

Returns a new [RoleBlock object](#RoleBlock) that should be used to add more roles.

##### **_name_**

Type: `string`

The Name of the new role.

#### **addRole(data: RoleBlock): DSDataServiceRole**

Returns [DSDataServiceRole object](#DSDataServiceRole) to continue api chaning.

##### **_data_**

Type: `RoleBlock`

The RoleBlock Object that was returned by `createNewRole()` method.

#### **removeRole(name: string): DSDataServiceRole**

Returns [DSDataServiceRole object](#DSDataServiceRole) to continue api chaning.

##### **_name_**

Type: `string`

The Name of the role that needs to be removed.

<hr>

### **DSDataServiceSchema**

<hr>

### **RoleBlock**

The Object used by Roles.

#### **setName(name: string): void**

This Method sets Name of the Role.

Returns [RoleBlock object](#RoleBlock) to continue api chaning.

#### **setDescription(description?: string): void**

This Method sets Description of the Role.

Returns [RoleBlock object](#RoleBlock) to continue api chaning.

#### **enableCreate(): RoleBlock**

This Method Enables Create Permission in the Role.

Returns [RoleBlock object](#RoleBlock) to continue api chaning.

#### **disableCreate(): RoleBlock**

This Method Disables Create Permission in the Role.

Returns [RoleBlock object](#RoleBlock) to continue api chaning.

#### **enableEdit(): RoleBlock**

This Method Enables Edit Permission in the Role.

Returns [RoleBlock object](#RoleBlock) to continue api chaning.

#### **disableEdit(): RoleBlock**

This Method Disables Edit Permission in the Role.

Returns [RoleBlock object](#RoleBlock) to continue api chaning.

#### **enableDelete(): RoleBlock**

This Method Enables Delete Permission in the Role.

Returns [RoleBlock object](#RoleBlock) to continue api chaning.

#### **disableDelete(): RoleBlock**

This Method Disables Delete Permission in the Role.

Returns [RoleBlock object](#RoleBlock) to continue api chaning.

#### **enableReview(): RoleBlock**

This Method Enables Review Permission in the Role.

Returns [RoleBlock object](#RoleBlock) to continue api chaning.

#### **disableReview(): RoleBlock**

This Method Disables Review Permission in the Role.

Returns [RoleBlock object](#RoleBlock) to continue api chaning.

#### **enableSkipReview(): RoleBlock**

This Method Enables Skip Review Permission in the Role.

Returns [RoleBlock object](#RoleBlock) to continue api chaning.

#### **disableSkipReview(): RoleBlock**

This RoleBlock Disables Skip Review RoleBlock in the Role.

Returns [RoleBlock object](#RoleBlock) to continue api chaning.

<hr>

### **ListOptions**

#### select: string

To show only selected fields in records.

#### sort: string

To set the sorting order of records.

#### page: number

For pagination.

#### count: number

To Limit the no of records.

#### filter: object

To filter the records.

#### expand: boolean

To expand the docs if contains relation.

<hr>

### **WebHook**

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

### **ErrorResponse**

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

### **ENV Variables**

The Credentials/Token can also be set via ENV.

| ENV Variables           | Description                      |
| ----------------------- | -------------------------------- |
| **DATA_STACK_HOST**     | The FQDN of Data Stack           |
| **DATA_STACK_USERNAME** | Username / Client ID of Bot      |
| **DATA_STACK_PASSWORD** | User's Password / API Key of Bot |
| **DATA_STACK_TOKEN**    | The existing JWT token           |
