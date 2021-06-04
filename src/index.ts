import got from 'got';
import { assignIn } from 'lodash';
import { interval } from 'rxjs';
import { Credentials, App, ListOptions, ErrorResponse, DataService, DataStackDocument, WebHook, RoleBlock, SchemaField, SchemaFieldTypes } from './types';

var authData: AuthHandler;

export function authenticateByCredentials(creds: Credentials): Promise<DataStack> {
    authData = new AuthHandler(creds);
    return authData.login();
}

export function authenticateByToken(creds: Credentials): Promise<DataStack> {
    authData = new AuthHandler(creds);
    return authData.authenticateByToken();
}

class AuthHandler {

    creds: Credentials;

    _id: string | undefined;
    uuid: string | undefined;
    token: string | undefined;
    rToken: string | undefined;
    expiresIn: number | undefined;
    rbacBotTokenDuration: number = 600;
    rbacHbInterval: number = 60;
    rbacUserCloseWindowToLogout: boolean = false;
    rbacUserToSingleSession: boolean = false;
    rbacUserTokenDuration: number = 600;
    rbacUserTokenRefresh: boolean = false;
    serverTime: number | undefined;
    bot: boolean = false;

    private hbRoutine: any;
    private refreshRoutine: any;
    private api: string;

    constructor(creds: Credentials) {
        this.creds = new Credentials(creds);
        this.api = this.creds.host + '/api/a/rbac';
    }

    async login(): Promise<DataStack> {
        try {
            const payload = { username: this.creds.username, password: this.creds.password };
            const resp = await got.post(this.api + '/login', { json: payload, responseType: 'json' });
            const data = resp.body;
            this.patchData(data);
            if (this.rbacUserToSingleSession || this.rbacUserCloseWindowToLogout) {
                this.createHBRoutine();
            }
            if (this.rbacUserTokenRefresh) {
                this.createTokenRefreshRoutine();
            }
            return new DataStack();
        } catch (err) {
            throw new ErrorResponse(err.response);
        }
    }

    async authenticateByToken(): Promise<DataStack> {
        try {
            const resp = await got.get(this.api + '/check', { responseType: 'json' });
            const data = resp.body;
            this.patchData(data);
            if (this.rbacUserToSingleSession || this.rbacUserCloseWindowToLogout) {
                this.createHBRoutine();
            }
            if (this.rbacUserTokenRefresh) {
                this.createTokenRefreshRoutine();
            }
            return new DataStack();
        } catch (err) {
            throw new ErrorResponse(err.response);
        }
    }

    private async createHBRoutine() {
        const intervalValue = (this.rbacHbInterval * 1000) - 1000;
        this.hbRoutine = interval(intervalValue).subscribe(async () => {
            console.log('[HB Triggred]', this.token, this.uuid);
            try {
                let resp = await got.put(this.api + '/usr/hb', {
                    headers: {
                        Authorization: 'JWT ' + this.token
                    },
                    responseType: 'json',
                    json: {
                        uuid: this.uuid
                    }
                }) as any;
                const data = resp.body;
                this.patchData(data);
            } catch (err) {
                if (err.response.statusCode === 401) {
                    if (this.creds?.username && this.creds?.password) {
                        this.login();
                    }
                    if (this.hbRoutine) {
                        this.hbRoutine.unsubscribe();
                    }
                } else {
                    console.log(err.body);
                }
                console.error('[ERROR] [createHBRoutine]', err);
            }
        });
    }

    private createTokenRefreshRoutine() {
        let intervalValue = (this.rbacUserTokenDuration - (5 * 60)) * 1000;
        if (this.bot) {
            intervalValue = (this.rbacBotTokenDuration - (5 * 60)) * 1000;
        }
        this.refreshRoutine = interval(intervalValue).subscribe(async () => {
            console.log('[Refresh Triggred]', this.token, this.rToken);
            try {
                let resp = await got.get(this.api + '/refresh', {
                    headers: {
                        rToken: 'JWT ' + this.rToken,
                        Authorization: 'JWT ' + this.token
                    },
                    responseType: 'json'
                }) as any;
                const data = resp.body;
                this.patchData(data);
            } catch (err) {
                if (err.response.statusCode === 401) {
                    if (this.creds?.username && this.creds?.password) {
                        this.login();
                    }
                    if (this.refreshRoutine) {
                        this.refreshRoutine.unsubscribe();
                    }
                } else {
                    console.log(err.response.body);
                }
                console.error('[ERROR] [createTokenRefreshRoutine]', err);
            }
        });
    }

    private patchData(data: any) {
        this._id = data?._id;
        this.uuid = data?.uuid;
        this.token = data?.token;
        this.rToken = data?.rToken;
        this.expiresIn = data?.expiresIn;
        this.rbacBotTokenDuration = data?.rbacBotTokenDuration || 600;
        this.rbacHbInterval = data?.rbacHbInterval || 60;
        this.rbacUserCloseWindowToLogout = data?.rbacUserCloseWindowToLogout || false;
        this.rbacUserToSingleSession = data?.rbacUserToSingleSession || false;
        this.rbacUserTokenDuration = data?.rbacUserTokenDuration || 600;
        this.rbacUserTokenRefresh = data?.rbacUserTokenRefresh || false;
        this.serverTime = data?.serverTime;
        this.bot = data?.bot;
    }
}



export class DataStack {

    api: string;
    constructor() {
        this.api = authData.creds.host + '/api/a/rbac/app';
    }

    public async ListApps(): Promise<DSApp[]> {
        try {
            let resp = await got.get(this.api, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return resp.body.map((item: any) => {
                return new DSApp(item);
            });
        } catch (err) {
            console.error('[ERROR] [ListApps]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async App(name: string): Promise<DSApp> {
        try {
            let resp = await got.get(this.api + '/' + name, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return new DSApp(resp.body);
        } catch (err) {
            console.error('[ERROR] [App]', err);
            throw new ErrorResponse(err.response);
        }
    }

}

export class DSApp {
    app: App;
    api: string;
    constructor(app: App) {
        this.app = new App(app);
        this.api = authData.creds.host + '/api/a/sm/service';
    }

    public async ListDataServices(): Promise<DSDataService[]> {
        try {
            const filter = { app: this.app._id };
            const searchParams = new URLSearchParams();
            searchParams.append('filter', JSON.stringify(filter));
            // searchParams.append('draft', 'true');
            let resp = await got.get(this.api, {
                searchParams: searchParams,
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return resp.body.map((item: any) => {
                new DSDataService(this.app, item);
            });
        } catch (err) {
            console.error('[ERROR] [ListDataServices]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async DataService(name: string): Promise<DSDataService> {
        try {
            const filter = { app: this.app._id, $or: [{ name }, { _id: name }] };
            const searchParams = new URLSearchParams();
            searchParams.append('filter', JSON.stringify(filter));
            // searchParams.append('draft', 'true');
            let resp = await got.get(this.api, {
                searchParams: searchParams,
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            if (Array.isArray(resp.body)) {
                return new DSDataService(this.app, resp.body[0]);
            } else {
                return new DSDataService(this.app, resp.body);
            }
        } catch (err) {
            console.error('[ERROR] [DataService]', err);
            throw new ErrorResponse(err.response);
        }
    }
}


export class DSDataService {
    app: App;
    data: DataService;
    private api: string;
    private smApi: string;
    constructor(app: App, data: DataService) {
        this.app = new App(app);
        this.data = new DataService(data);
        this.api = authData.creds.host + `/api/a/sm/${this.data._id}`;
        this.smApi = authData.creds.host + `/api/a/sm/service`;
    }

    public async Start(): Promise<ErrorResponse> {
        try {
            let resp = await got.put(this.api + '/start', {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return new ErrorResponse({ statusCode: 200, body: resp.body });
        } catch (err) {
            console.error('[ERROR] [Start]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async Stop(): Promise<ErrorResponse> {
        try {
            let resp = await got.put(this.api + '/stop', {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return new ErrorResponse({ statusCode: 200, body: resp.body });
        } catch (err) {
            console.error('[ERROR] [Stop]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async ScaleUp(): Promise<ErrorResponse> {
        try {
            let resp = await got.put(this.api + '/start', {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return new ErrorResponse({ statusCode: 200, body: resp.body });
        } catch (err) {
            console.error('[ERROR] [ScaleUp]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async ScaleDown(): Promise<ErrorResponse> {
        try {
            let resp = await got.put(this.api + '/stop', {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return new ErrorResponse({ statusCode: 200, body: resp.body });
        } catch (err) {
            console.error('[ERROR] [ScaleDown]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async Repair(): Promise<ErrorResponse> {
        try {
            let resp = await got.put(this.api + '/repair', {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return new ErrorResponse({ statusCode: 200, body: resp.body });
        } catch (err) {
            console.error('[ERROR] [Repair]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public getIntegrations(): DSDataServiceIntegration {
        try {
            return new DSDataServiceIntegration(this.app, this.data);
        } catch (err) {
            console.error('[ERROR] [getIntegrations]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async setIntegrations(data: DSDataServiceIntegration): Promise<DSDataService> {
        try {
            assignIn(this.data, data.getData());
            let resp = await got.put(this.smApi + '/' + this.data._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: this.createPayload()
            }) as any;
            assignIn(this.data, resp.body);
            return this;
        } catch (err) {
            console.error('[ERROR] [setIntegrations]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public getRoles(): DSDataServiceRole {
        try {
            return new DSDataServiceRole(this.app, this.data);
        } catch (err) {
            console.error('[ERROR] [getRoles]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async setRoles(data: DSDataServiceRole): Promise<DSDataService> {
        try {
            assignIn(this.data, data.getData());
            let resp = await got.put(this.smApi + '/' + this.data._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: this.createPayload()
            }) as any;
            assignIn(this.data, resp.body);
            return this;
        } catch (err) {
            console.error('[ERROR] [setRoles]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public getSchema(): DSDataServiceSchema {
        try {
            return new DSDataServiceSchema(this.app, this.data);
        } catch (err) {
            console.error('[ERROR] [getSchema]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async setSchema(data: DSDataServiceSchema): Promise<DSDataService> {
        try {
            assignIn(this.data, data.getData());
            let resp = await got.put(this.smApi + '/' + this.data._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: this.createPayload()
            }) as any;
            assignIn(this.data, resp.body);
            return this;
        } catch (err) {
            console.error('[ERROR] [setSchema]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public DataAPIs() {
        return new DataMethods(this.app, this.data);
    }

    private createPayload() {
        const data = JSON.parse(JSON.stringify(this.data));
        this.cleanPayload(data.definition);
        return data;
    }

    private cleanPayload(definition: Array<any>) {
        if (definition) {
            definition.forEach((item: any) => {
                if (item.type === 'Object' || item.type === 'Array') {
                    this.cleanPayload(item.definition);
                } else {
                    if (Array.isArray(item.properties.enum) && item.properties.enum.length == 0) {
                        delete item.properties.enum;
                    };
                    if (Array.isArray(item.properties.tokens) && item.properties.tokens.length == 0) {
                        delete item.properties.tokens;
                    };
                }
            });
        }
    }
}

export class DSDataServiceRole {
    private app: App;
    private data: DataService;
    private api: string;
    constructor(app: App, data: DataService) {
        this.app = app;
        this.data = data;
        this.api = authData.creds.host + `/api/a/sm/${this.data._id}`;
    }

    public getData(): DataService {
        return this.data;
    }

    public listRoles(): RoleBlock[] {
        try {
            return this.data.role.roles;
        } catch (err) {
            console.error('[ERROR] [listRoles]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public getRole(name: string): RoleBlock | undefined {
        try {
            return this.data.role.roles.find(e => e.name === name);
        } catch (err) {
            console.error('[ERROR] [getRole]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public createNewRole(name: string, description?: string): RoleBlock {
        try {
            const temp = new RoleBlock();
            temp.setName(name);
            temp.setDescription(description);
            return temp;
        } catch (err) {
            console.error('[ERROR] [getRole]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public addRole(data: RoleBlock): DSDataServiceRole {
        try {
            if (!(data instanceof RoleBlock)) {
                throw new Error('Please create a new role first');
            }
            this.data.role.roles.push(data);
            return this;
        } catch (err) {
            console.error('[ERROR] [addRole]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public removeRole(name: string): DSDataServiceRole {
        try {
            const index = this.data.role.roles.findIndex(e => e.name === name);
            this.data.role.roles.splice(index, 1);
            return this;
        } catch (err) {
            console.error('[ERROR] [removeRole]', err);
            throw new ErrorResponse(err.response);
        }
    }
}


export class DSDataServiceIntegration {
    private app: App;
    private data: DataService;
    private api: string;
    constructor(app: App, data: DataService) {
        this.app = app;
        this.data = data;
        this.api = authData.creds.host + `/api/a/sm/${this.data._id}`;
    }

    public getData(): DataService {
        return this.data;
    }

    public listPreHook(): WebHook[] {
        try {
            return this.data.preHooks;
        } catch (err) {
            console.error('[ERROR] [listPreHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public getPreHook(name: string): WebHook | undefined {
        try {
            return this.data.preHooks.find(e => e.name === name);
        } catch (err) {
            console.error('[ERROR] [getPreHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public addPreHook(data: WebHook): DSDataServiceIntegration {
        try {
            this.data.preHooks.push(data);
            return this;
        } catch (err) {
            console.error('[ERROR] [addPreHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public removePreHook(name: string): DSDataServiceIntegration {
        try {
            const index = this.data.preHooks.findIndex(e => e.name === name);
            this.data.preHooks.splice(index, 1);
            return this;
        } catch (err) {
            console.error('[ERROR] [removePreHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public listPostHook(): WebHook[] {
        try {
            return this.data.webHooks;
        } catch (err) {
            console.error('[ERROR] [listPostHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public getPostHook(name: string): WebHook | undefined {
        try {
            return this.data.webHooks.find(e => e.name === name);
        } catch (err) {
            console.error('[ERROR] [getPostHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public addPostHook(data: WebHook): DSDataServiceIntegration {
        try {
            this.data.webHooks.push(data);
            return this;
        } catch (err) {
            console.error('[ERROR] [addPostHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public removePostHook(name: string): DSDataServiceIntegration {
        try {
            const index = this.data.webHooks.findIndex(e => e.name === name);
            this.data.webHooks.splice(index, 1);
            return this;
        } catch (err) {
            console.error('[ERROR] [removePostHook]', err);
            throw new ErrorResponse(err.response);
        }
    }
}

export class DSDataServiceSchema {
    private app: App;
    private data: DataService;
    private api: string;
    constructor(app: App, data: DataService) {
        this.app = app;
        this.data = data;
        this.api = authData.creds.host + `/api/a/sm/${this.data._id}`;
    }

    public getData(): DataService {
        return this.data;
    }

    public getJSONSchema() {
        try {
            return this.data.preHooks;
        } catch (err) {
            console.error('[ERROR] [listPreHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public setJSONSchema(schema: any) {
        try {
            return this.data.preHooks;
        } catch (err) {
            console.error('[ERROR] [listPreHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public newField(data?: SchemaField): SchemaField {
        try {
            return new SchemaField(data);
        } catch (err) {
            console.error('[ERROR] [getPreHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public getField(name: string): SchemaField | undefined {
        try {
            return this.data.definition.find(e => e.getName() === name);
        } catch (err) {
            console.error('[ERROR] [getPreHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public addField(data: SchemaField) {
        try {
            this.data.definition.push(data);
            return this;
        } catch (err) {
            console.error('[ERROR] [addPreHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public patchField(data: SchemaField) {
        try {
            this.data.definition.push(data);
            return this;
        } catch (err) {
            console.error('[ERROR] [addPreHook]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public removeField(name: string) {
        try {
            const index = this.data.preHooks.findIndex(e => e.name === name);
            this.data.preHooks.splice(index, 1);
            return this;
        } catch (err) {
            console.error('[ERROR] [removePreHook]', err);
            throw new ErrorResponse(err.response);
        }
    }
}

export class DataMethods {
    app: App;
    data: DataService;
    api: string;
    constructor(app: App, data: DataService) {
        this.app = app;
        this.data = data;
        this.api = authData.creds.host + '/api/c/' + this.app._id + this.data.api;
    }

    public async CountRecords(): Promise<number> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('countOnly', 'true');
            let resp = await got.get(this.api, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                searchParams
            }) as any;
            return resp.body;
        } catch (err) {
            console.error('[ERROR] [Count]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async ListRecords(options: ListOptions): Promise<DataStackDocument[]> {
        try {
            const searchParams = new URLSearchParams();
            if (options?.select) {
                searchParams.append('select', options.select);
            }
            if (options?.sort) {
                searchParams.append('sort', options.sort);
            }
            if (options?.count) {
                searchParams.append('count', options.count.toString());
            }
            if (options?.page) {
                searchParams.append('page', options.page.toString());
            }
            if (options?.expand) {
                searchParams.append('expand', options.expand.toString());
            }
            if (options?.filter) {
                searchParams.append('filter', JSON.stringify(options.filter));
            }
            let resp = await got.get(this.api, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                searchParams: searchParams,
                responseType: 'json',
            }) as any;
            return resp.body.map((item: any) => {
                return new DataStackDocument(item);
            });
        } catch (err) {
            console.error('[ERROR] [List]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async GetRecord(id: string): Promise<DataStackDocument> {
        try {
            let resp = await got.get(this.api + '/' + id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return new DataStackDocument(resp.body);
        } catch (err) {
            console.error('[ERROR] [Get]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async UpdateRecord(id: string, data: any): Promise<DataStackDocument> {
        try {
            let resp = await got.put(this.api + '/' + id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: data
            }) as any;
            return new DataStackDocument(resp.body);
        } catch (err) {
            console.error('[ERROR] [Put]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async CreateRecord(data: any): Promise<DataStackDocument> {
        try {
            let resp = await got.post(this.api, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: data
            }) as any;
            return new DataStackDocument(resp.body);
        } catch (err) {
            console.error('[ERROR] [Post]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async DeleteRecord(id: string): Promise<ErrorResponse> {
        try {
            let resp = await got.delete(this.api + '/' + id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return new ErrorResponse({ statusCode: 200, body: resp.body });
        } catch (err) {
            console.error('[ERROR] [Delete]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public CreateMath(): MathAPI {
        try {
            return new MathAPI();
        } catch (err) {
            console.error('[ERROR] [Delete]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async ApplyMath(id: string, math: MathAPI): Promise<DataStackDocument> {
        try {
            let resp = await got.put(this.api + '/' + id + '/math', {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: math.CreatePayload()
            }) as any;
            return new DataStackDocument(resp.body);
        } catch (err) {
            console.error('[ERROR] [Delete]', err);
            throw new ErrorResponse(err.response);
        }
    }
}

export class MathAPI {
    private selectedField: string | undefined;
    private operations: any;
    constructor() {
        // this.operations = { $inc: {}, $mul: {} };
        this.operations = [];
    }

    SelectField(path: string) {
        this.selectedField = path;
        return this;
    }

    Increment(num: number) {
        if (!this.selectedField) {
            throw new Error('Please select the field first while using Math API');
        }
        // this.operations.$inc[this.selectedField] = num;
        this.operations.push({ $inc: { [this.selectedField]: num } });
        return this;
    }

    Multiply(num: number) {
        if (!this.selectedField) {
            throw new Error('Please select the field first while using Math API');
        }
        // this.operations.$mul[this.selectedField] = num;
        this.operations.push({ $mul: { [this.selectedField]: num } });
        return this;
    }

    CreatePayload() {
        return this.operations;
    }
}

export default { authenticateByCredentials, authenticateByToken };
