import got from 'got';
import { interval } from 'rxjs';
import { Credentials, App, ListOptions, ErrorResponse, DataService, DataStackDocument } from './types';

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
        this.creds = creds;
        this.api = this.creds.host + '/api/a/rbac';
    }

    login(): Promise<DataStack> {
        return new Promise((resolve, reject) => {
            const payload = { username: this.creds.username, password: this.creds.password };
            got.post(this.api + '/login', { json: payload, responseType: 'json' })
                .then((resp: any) => {
                    const data = resp.body;
                    this.patchData(data);
                    if (this.rbacUserToSingleSession || this.rbacUserCloseWindowToLogout) {
                        this.createHBRoutine();
                    }
                    if (this.rbacUserTokenRefresh) {
                        this.createTokenRefreshRoutine();
                    }
                    resolve(new DataStack());

                })
                .catch(err => {
                    console.log(err.response)
                    reject(err.response);
                });
        });
    }

    authenticateByToken(): Promise<DataStack> {
        return new Promise((resolve, reject) => {
            got.get(this.api + '/check', { responseType: 'json' })
                .then((resp: any) => {
                    const data = resp.body;
                    this.patchData(data);
                    if (this.rbacUserToSingleSession || this.rbacUserCloseWindowToLogout) {
                        this.createHBRoutine();
                    }
                    if (this.rbacUserTokenRefresh) {
                        this.createTokenRefreshRoutine();
                    }
                    resolve(new DataStack());

                })
                .catch(err => {
                    console.log(err.response)
                    reject(err.response);
                });
        });
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
        this.app = app;
        this.api = authData.creds.host + '/api/a/sm/service';
    }

    public async ListDataServices(): Promise<DSDataService[]> {
        try {
            let resp = await got.get(this.api, {
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
            let resp = await got.get(this.api, {
                searchParams: searchParams.toString(),
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
    api: string;
    constructor(app: App, data: DataService) {
        this.app = app;
        this.data = data;
        this.api = authData.creds.host + `/api/a/sm/${this.data._id}`;
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

    public CRUD() {
        return new CRUDMethods(this.app, this.data);
    }
}

export class CRUDMethods {
    app: App;
    data: DataService;
    api: string;
    constructor(app: App, data: DataService) {
        this.app = app;
        this.data = data;
        this.api = authData.creds.host + '/api/c/' + this.app._id + this.data.api;
    }

    public async Count(): Promise<number> {
        try {
            let resp = await got.get(this.api + '/count', {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return resp.body;
        } catch (err) {
            console.error('[ERROR] [Count]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async List(options: ListOptions): Promise<DataStackDocument[]> {
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
            if (options?.filter) {
                searchParams.append('filter', JSON.stringify(options.filter));
            }
            let resp = await got.get(this.api, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                searchParams: searchParams.toString(),
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

    public async Get(id: string): Promise<DataStackDocument> {
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

    public async Put(id: string, data: any): Promise<DataStackDocument> {
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

    public async Post(data: any): Promise<DataStackDocument> {
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

    public async Delete(id: string): Promise<ErrorResponse> {
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
}

export default { authenticateByCredentials, authenticateByToken };
