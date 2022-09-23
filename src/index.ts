import got, { Got } from 'got';
import FormData from 'form-data'; 'form-data';
import { assignIn } from 'lodash';
import { interval } from 'rxjs';
import { getLogger } from 'log4js';
import { createReadStream } from 'fs';
import { Credentials, App, ListOptions, ErrorResponse, DataService, DataStackDocument, WebHook, RoleBlock, SchemaField, SuccessResponse, WorkflowRespond, WorkflowActions, FileUploadResponse, Yamls } from './types';
import { LIB_VERSION } from './version';

var authData: AuthHandler;
var httpRequest: Got;
var logger = getLogger(`[@appveen/ds-sdk] [${LIB_VERSION}]`);
logger.level = 'error';

interface AuthData {
    _id: string | undefined;
    uuid: string | undefined;
    token: string | undefined;
    rToken: string | undefined;
    isSuperAdmin: boolean;
    expiresIn: number | undefined;
    rbacBotTokenDuration: number | undefined;
    rbacHbInterval: number | undefined;
    rbacUserCloseWindowToLogout: boolean;
    rbacUserToSingleSession: boolean;
    rbacUserTokenDuration: number | undefined;
    rbacUserTokenRefresh: boolean;
    serverTime: number | undefined;
    defaultTimezone: string | undefined;
    bot: boolean;
}

export function authenticateByCredentials(creds: Credentials): Promise<DataStack> {
    if (creds.trace) {
        logger.level = 'info';
    }
    if (creds.logger) {
        logger = creds.logger;
    }
    authData = new AuthHandler(creds);
    httpRequest = got.extend({ prefixUrl: creds.host, https: { rejectUnauthorized: false } });
    return authData.login();
}

export function authenticateByToken(creds: Credentials): Promise<DataStack> {
    authData = new AuthHandler(creds);
    if (creds.trace) {
        logger.level = 'info';
    }
    if (creds.logger) {
        logger = creds.logger;
    }
    return authData.authenticateByToken();
}


function logError(message: string, err: any) {
    if (err) {
        if (err.response) {
            logger.error(message, err.response.statusCode, err.response.body);
        } else {
            logger.error(message, err);
        }
    } else {
        logger.error(message)
    }
}

class AuthHandler implements AuthData {

    creds: Credentials;

    _id: string | undefined;
    uuid: string | undefined;
    token: string | undefined;
    rToken: string | undefined;
    isSuperAdmin: boolean;
    expiresIn: number | undefined;
    rbacBotTokenDuration: number = 600;
    rbacHbInterval: number = 60;
    rbacUserCloseWindowToLogout: boolean = false;
    rbacUserToSingleSession: boolean = false;
    rbacUserTokenDuration: number = 600;
    rbacUserTokenRefresh: boolean = false;
    serverTime: number | undefined;
    defaultTimezone: string;
    bot: boolean = false;

    private hbRoutine: any;
    private refreshRoutine: any;
    private api: string;

    constructor(creds: Credentials) {
        this.creds = new Credentials(creds);
        this.api = 'api/a/rbac';
        this.defaultTimezone = 'Zulu';
        this.isSuperAdmin = false;
    }

    async login(): Promise<DataStack> {
        try {
            logger.info('Authenticating at:', this.creds.host);
            logger.info('Using Username:', this.creds.username);
            const payload = { username: this.creds.username, password: this.creds.password };
            const resp = await httpRequest.post(this.api + '/auth/login', {
                json: payload,
                responseType: 'json'
            });
            const data = resp.body;
            this.patchData(data);
            logger.info('Authentication Successfull');
            if (this.rbacUserToSingleSession || this.rbacUserCloseWindowToLogout) {
                logger.info('Creating HB Routine');
                this.createHBRoutine();
            }
            if (this.rbacUserTokenRefresh) {
                logger.info('Creating Auto Refresh Routine');
                this.createTokenRefreshRoutine();
            }
            return new DataStack(this);
        } catch (err: any) {
            throw new ErrorResponse(err.response);
        }
    }

    async logout(): Promise<void> {
        try {
            const resp = await httpRequest.delete(this.api + '/auth/logout', {
                responseType: 'json'
            });
            logger.info('Logged out Successfull');
            this.clearRoutine();
        } catch (err: any) {
            throw new ErrorResponse(err.response);
        }
    }

    async authenticateByToken(): Promise<DataStack> {
        try {
            const resp = await httpRequest.get(this.api + '/auth/check', {
                responseType: 'json',
                headers: {
                    authorization: this.creds.token
                }
            });
            const data = resp.body;
            this.patchData(data);
            if (this.rbacUserToSingleSession || this.rbacUserCloseWindowToLogout) {
                this.createHBRoutine();
            }
            if (this.rbacUserTokenRefresh) {
                this.createTokenRefreshRoutine();
            }
            return new DataStack(this);
        } catch (err: any) {
            throw new ErrorResponse(err.response);
        }
    }

    private async createHBRoutine() {
        const intervalValue = (this.rbacHbInterval * 1000) - 1000;
        this.hbRoutine = interval(intervalValue).subscribe(async () => {
            logger.info('[HB Triggred]');
            logger.debug(this.token, this.uuid);
            try {
                let resp = await httpRequest.put(this.api + '/auth/hb', {
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
            } catch (err: any) {
                if (err.response.statusCode === 401) {
                    if (this.creds?.username && this.creds?.password) {
                        this.login();
                    }
                    if (this.hbRoutine) {
                        this.hbRoutine.unsubscribe();
                    }
                }
                logError('[ERROR] [createHBRoutine]', err);
            }
        });
    }

    private createTokenRefreshRoutine() {
        let intervalValue = (this.rbacUserTokenDuration - (5 * 60)) * 1000;
        if (this.bot) {
            intervalValue = (this.rbacBotTokenDuration - (5 * 60)) * 1000;
        }
        this.refreshRoutine = interval(intervalValue).subscribe(async () => {
            logger.info('[Refresh Triggred]');
            logger.debug(this.token, this.rToken);
            try {
                let resp = await httpRequest.get(this.api + '/auth/refresh', {
                    headers: {
                        rToken: 'JWT ' + this.rToken,
                        Authorization: 'JWT ' + this.token
                    },
                    responseType: 'json'
                }) as any;
                const data = resp.body;
                this.patchData(data);
            } catch (err: any) {
                if (err.response.statusCode === 401) {
                    if (this.creds?.username && this.creds?.password) {
                        this.login();
                    }
                    if (this.refreshRoutine) {
                        this.refreshRoutine.unsubscribe();
                    }
                }
                logError('[ERROR] [createTokenRefreshRoutine]', err);
            }
        });
    }

    private clearRoutine() {
        if (this.hbRoutine) {
            this.hbRoutine.unsubscribe();
        }
        if (this.refreshRoutine) {
            this.refreshRoutine.unsubscribe();
        }
    }

    private patchData(data: any) {
        this._id = data?._id;
        this.uuid = data?.uuid;
        this.token = data?.token;
        this.rToken = data?.rToken;
        this.expiresIn = data?.expiresIn;
        this.isSuperAdmin = data?.isSuperAdmin || false;
        this.rbacBotTokenDuration = data?.rbacBotTokenDuration || 600;
        this.rbacHbInterval = data?.rbacHbInterval || 60;
        this.rbacUserCloseWindowToLogout = data?.rbacUserCloseWindowToLogout || false;
        this.rbacUserToSingleSession = data?.rbacUserToSingleSession || false;
        this.rbacUserTokenDuration = data?.rbacUserTokenDuration || 600;
        this.rbacUserTokenRefresh = data?.rbacUserTokenRefresh || false;
        this.serverTime = data?.serverTime;
        this.bot = data?.bot;
        this.defaultTimezone = data?.defaultTimezone || 'Zulu';
    }
}



export class DataStack {

    authData: AuthData;
    api: string;
    constructor(data: AuthData) {
        this.api = 'api/a/rbac';
        this.authData = data;
    }

    public async Logout(): Promise<void> {
        try {
            return await authData.logout();
        } catch (err: any) {
            logError('[ERROR] [Logout]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async CountApps(filter?: any): Promise<DSApp[]> {
        try {
            const searchParams = new URLSearchParams();
            if (filter) {
                searchParams.append('filter', JSON.stringify(filter));
            }
            searchParams.append('countOnly', 'true');
            let resp = await httpRequest.get(this.api + '/data/app/count', {
                searchParams: searchParams,
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return resp.body.map((item: any) => {
                return new DSApp(item);
            });
        } catch (err: any) {
            logError('[ERROR] [CountApps]', err);
            throw new ErrorResponse(err.response);
        }
    }


    public async ListApps(options: ListOptions): Promise<DSApp[]> {
        try {
            const searchParams = new URLSearchParams();
            if (options && options.filter) {
                searchParams.append('filter', JSON.stringify(options.filter));
            }
            if (options && options.select) {
                searchParams.append('select', options.select);
            }
            searchParams.append('count', '-1');
            let resp = await httpRequest.get(this.api + '/data/app', {
                searchParams: searchParams,
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return resp.body.map((item: any) => {
                return new DSApp(item);
            });
        } catch (err: any) {
            logError('[ERROR] [ListApps]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async App(name: string): Promise<DSApp> {
        try {
            let resp = await httpRequest.get(this.api + '/data/app/' + name, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return new DSApp(resp.body);
        } catch (err: any) {
            logError('[ERROR] [App]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async CreateApp(name: string): Promise<DSApp> {
        try {
            if (!this.authData.isSuperAdmin) {
                throw new ErrorResponse({ statusMessage: 'Only Super Admins Can Create an App' });
            }
            let resp = await httpRequest.post(this.api + '/admin/app', {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {
                    _id: name,
                    defaultTimezone: authData.defaultTimezone,
                }
            }) as any;
            return new DSApp(resp.body);
        } catch (err: any) {
            logError('[ERROR] [CreateApp]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async DeleteApp(name: string): Promise<DataStack> {
        try {
            if (!this.authData.isSuperAdmin) {
                throw new ErrorResponse({ statusMessage: 'Only Super Admins Can Delete an App' });
            }
            let resp = await httpRequest.delete(this.api + '/admin/app/' + name, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            return this;
        } catch (err: any) {
            logError('[ERROR] [DeleteApp]', err);
            throw new ErrorResponse(err.response);
        }
    }
}

export class DSApp {
    app: App;
    api: string;
    private dataServiceMap: any;
    constructor(app: App) {
        this.app = new App(app);
        this.api = `api/a/sm/${this.app._id}/service`;
        this.dataServiceMap = {};
        this.CreateDataServiceMap();
    }

    private async CreateDataServiceMap() {
        const searchParams = new URLSearchParams();
        searchParams.append('count', '-1');
        searchParams.append('select', '_id,name');
        let resp = await httpRequest.get(this.api, {
            searchParams: searchParams,
            headers: {
                Authorization: 'JWT ' + authData.token
            },
            responseType: 'json'
        }) as any;
        return resp.body.map((item: any) => {
            this.dataServiceMap[item.name] = item._id;
        });
    }

    public async RepairAllDataServices(filter: any): Promise<SuccessResponse[]> {
        try {
            let searchParams = new URLSearchParams();
            searchParams.append('count', '-1');
            searchParams.append('select', '_id,name');
            if (filter) {
                searchParams.append('filter', JSON.stringify(filter));
            }
            const resp = await httpRequest.get(this.api, {
                searchParams: searchParams,
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            if (resp.body && resp.body.length > 0) {
                let promises = resp.body.map(async (e: any) => {
                    logger.info('Repairing Data Service', e._id);
                    let resp = await httpRequest.put(this.api + `/utils/${e._id}/repair`, {
                        headers: {
                            Authorization: 'JWT ' + authData.token
                        },
                        responseType: 'json',
                        json: {}
                    }) as any;
                    return new SuccessResponse(resp.body);
                });
                promises = await Promise.all(promises);
                return promises;
            } else {
                return [];
            }
        } catch (err: any) {
            logError('[ERROR] [RepairAllDataServices]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async StartAllDataServices(filter: any): Promise<SuccessResponse[]> {
        try {
            let searchParams = new URLSearchParams();
            searchParams.append('count', '-1');
            searchParams.append('select', '_id,name');
            if (filter) {
                searchParams.append('filter', JSON.stringify(filter));
            }
            const resp = await httpRequest.get(this.api, {
                searchParams: searchParams,
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            if (resp.body && resp.body.length > 0) {
                let promises = resp.body.map(async (e: any) => {
                    logger.info('Starting Data Service', e._id);
                    let resp = await httpRequest.put(this.api + `/utils/${e._id}/start`, {
                        headers: {
                            Authorization: 'JWT ' + authData.token
                        },
                        responseType: 'json',
                        json: {}
                    }) as any;
                    return new SuccessResponse(resp.body);
                });
                promises = await Promise.all(promises);
                return promises;
            } else {
                return [];
            }
        } catch (err: any) {
            logError('[ERROR] [StartAllDataServices]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async StopAllDataServices(filter: any): Promise<SuccessResponse[]> {
        try {
            let searchParams = new URLSearchParams();
            searchParams.append('count', '-1');
            searchParams.append('select', '_id,name');
            if (filter) {
                searchParams.append('filter', JSON.stringify(filter));
            }
            const resp = await httpRequest.get(this.api, {
                searchParams: searchParams,
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            if (resp.body && resp.body.length > 0) {
                let promises = resp.body.map(async (e: any) => {
                    logger.info('Repairing Data Service', e._id);
                    let resp = await httpRequest.put(this.api + `/utils/${e._id}/stop`, {
                        headers: {
                            Authorization: 'JWT ' + authData.token
                        },
                        responseType: 'json',
                        json: {}
                    }) as any;
                    return new SuccessResponse(resp.body);
                });
                promises = await Promise.all(promises);
                return promises;
            } else {
                return [];
            }
        } catch (err: any) {
            logError('[ERROR] [StopAllDataServices]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async CountDataServices(filter?: any): Promise<DSApp[]> {
        try {
            const searchParams = new URLSearchParams();
            if (filter) {
                searchParams.append('filter', JSON.stringify(filter));
            }
            searchParams.append('countOnly', 'true');
            let resp = await httpRequest.get(this.api + '/count', {
                searchParams: searchParams,
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return resp.body.map((item: any) => {
                return new DSApp(item);
            });
        } catch (err: any) {
            logError('[ERROR] [CountDataServices]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async ListDataServices(options: ListOptions): Promise<DSDataService[]> {
        try {
            const searchParams = new URLSearchParams();
            if (!options) {
                options = new ListOptions();
            }
            if (options.filter) {
                searchParams.append('filter', JSON.stringify(options.filter));
            }
            if (options.sort) {
                searchParams.append('sort', (options.sort));
            }
            if (options.select) {
                searchParams.append('select', (options.select));
            }
            if (options.page) {
                searchParams.append('page', (options.page + ''));
            }
            if (options.count) {
                searchParams.append('count', (options.count) + '');
            } else {
                searchParams.append('count', '30');
            }
            let resp = await httpRequest.get(this.api, {
                searchParams: searchParams,
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return resp.body.map((item: any) => {
                return new DSDataService(this.app, item);
            });
        } catch (err: any) {
            logError('[ERROR] [ListDataServices]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async DataService(name: string): Promise<DSDataService> {
        try {
            const filter = { app: this.app._id, $or: [{ name }, { _id: name }] };
            const searchParams = new URLSearchParams();
            searchParams.append('filter', JSON.stringify(filter));
            searchParams.append('count', '1');
            let resp = await httpRequest.get(this.api, {
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
        } catch (err: any) {
            logError('[ERROR] [DataService]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async CreateDataService(name: string, description?: string): Promise<DSDataService> {
        try {
            let resp = await httpRequest.post(this.api, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {
                    name,
                    description
                }
            }) as any;
            return new DSDataService(this.app, resp.body);
        } catch (err: any) {
            logError('[ERROR] [CreateDataService]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public TransactionAPI(): TransactionMethods {
        return new TransactionMethods(this.app, this.dataServiceMap);
    }
}


export class DSDataService {
    app: App;
    data: DataService;
    private originalData: DataService | undefined;
    private draftData: DataService | undefined;
    private api: string;
    private _isDraft: boolean;
    constructor(app: App, data: DataService) {
        this.app = new App(app);
        this.data = new DataService(data);
        this.originalData = new DataService(data);
        this.api = `api/a/sm/${this.app._id}/service`;
        this._isDraft = false;
        if (this.data.HasDraft()) {
            this.FetchDraft();
        }
    }

    private async FetchDraft() {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('draft', 'true');
            let resp = await httpRequest.get(this.api + `/${this.data._id}`, {
                searchParams,
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            this.draftData = new DataService(resp.body);
        } catch (err: any) {
            logError('[ERROR] [FetchDraft]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public HasDraft(): boolean {
        try {
            return this.data.HasDraft();
        } catch (err: any) {
            logError('[ERROR] [HasDraft]', err);
            throw new ErrorResponse(err);
        }
    }

    public IsDraft(): boolean {
        try {
            return this._isDraft;
        } catch (err: any) {
            logError('[ERROR] [IsDraft]', err);
            throw new ErrorResponse(err);
        }
    }

    public SwitchToDraft(): DSDataService {
        try {
            if (this.draftData) {
                this._isDraft = true;
                this.data = new DataService(this.draftData);
            }
            return this;
        } catch (err: any) {
            logError('[ERROR] [SwitchToDraft]', err);
            throw new ErrorResponse(err);
        }
    }

    public SwitchToOriginal(): DSDataService {
        try {
            this._isDraft = false;
            this.data = new DataService(this.originalData);
            return this;
        } catch (err: any) {
            logError('[ERROR] [SwitchToOriginal]', err);
            throw new ErrorResponse(err);
        }
    }

    public async DiscardDraft(): Promise<DSDataService> {
        try {
            let resp = await httpRequest.delete(this.api + `/utils/${this.data?._id}/draftDelete`, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            resp = await httpRequest.get(this.api + `/${this.data._id}`, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            this.originalData = resp.body;
            this.data = new DataService(resp.body);
            this.draftData = undefined;
            return this;
        } catch (err: any) {
            logError('[ERROR] [DiscardDraft]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async PurgeAllData(): Promise<DSDataService> {
        try {
            let resp = await httpRequest.delete(this.api + `/utils/${this.data._id}/purge/all`, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            return this;
        } catch (err: any) {
            logError('[ERROR] [PurgeAllData]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async PurgeApiLogs(): Promise<DSDataService> {
        try {
            let resp = await httpRequest.delete(this.api + `/utils/${this.data._id}/purge/log`, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            return this;
        } catch (err: any) {
            logError('[ERROR] [PurgeApiLogs]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async PurgeAuditLogs(): Promise<DSDataService> {
        try {
            let resp = await httpRequest.delete(this.api + `/utils/${this.data._id}/purge/audit`, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            return this;
        } catch (err: any) {
            logError('[ERROR] [PurgeAuditLogs]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async Delete(): Promise<DSApp> {
        try {
            let resp = await httpRequest.delete(this.api + '/' + this.data._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            return new DSApp(this.app);
        } catch (err: any) {
            logError('[ERROR] [Delete]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async Yamls(): Promise<Yamls | ErrorResponse> {
        try {
            let resp = await httpRequest.get(this.api + `/utils/${this.data._id}/yamls`, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return new Yamls(resp.body);
        } catch (err: any) {
            logError('[ERROR] [Yamls]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async Start(): Promise<SuccessResponse | ErrorResponse> {
        try {
            let resp = await httpRequest.put(this.api + `/utils/${this.data._id}/start`, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            return new SuccessResponse(resp.body);
        } catch (err: any) {
            logError('[ERROR] [Start]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async Stop(): Promise<SuccessResponse | ErrorResponse> {
        try {
            let resp = await httpRequest.put(this.api + `/utils/${this.data._id}/stop`, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            return new SuccessResponse(resp.body);
        } catch (err: any) {
            logError('[ERROR] [Stop]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async ScaleUp(): Promise<SuccessResponse | ErrorResponse> {
        try {
            let resp = await httpRequest.put(this.api + `/utils/${this.data._id}/start`, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            return new SuccessResponse(resp.body);
        } catch (err: any) {
            logError('[ERROR] [ScaleUp]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async ScaleDown(): Promise<SuccessResponse | ErrorResponse> {
        try {
            let resp = await httpRequest.put(this.api + `/utils/${this.data._id}/stop`, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            return new SuccessResponse(resp.body);
        } catch (err: any) {
            logError('[ERROR] [ScaleDown]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async Repair(): Promise<SuccessResponse | ErrorResponse> {
        try {
            let resp = await httpRequest.put(this.api + `/utils/${this.data._id}/repair`, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            return new SuccessResponse(resp.body);
        } catch (err: any) {
            logError('[ERROR] [Repair]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public getIntegrations(): DSDataServiceIntegration {
        try {
            return new DSDataServiceIntegration(this.app, this.data);
        } catch (err: any) {
            logError('[ERROR] [getIntegrations]', err);
            throw new ErrorResponse(err);
        }
    }

    public async setIntegrations(data: DSDataServiceIntegration): Promise<DSDataService> {
        try {
            assignIn(this.data, data.getData());
            let resp = await httpRequest.put(this.api + '/' + this.data._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: this.createPayload()
            }) as any;
            assignIn(this.data, resp.body);
            return this;
        } catch (err: any) {
            logError('[ERROR] [setIntegrations]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public getRoles(): DSDataServiceRole {
        try {
            return new DSDataServiceRole(this.app, this.data);
        } catch (err: any) {
            logError('[ERROR] [getRoles]', err);
            throw new ErrorResponse(err);
        }
    }

    public async setRoles(data: DSDataServiceRole): Promise<DSDataService> {
        try {
            assignIn(this.data, data.getData());
            let resp = await httpRequest.put(this.api + '/' + this.data._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: this.createPayload()
            }) as any;
            assignIn(this.data, resp.body);
            return this;
        } catch (err: any) {
            logError('[ERROR] [setRoles]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public getSchema(): DSDataServiceSchema {
        try {
            return new DSDataServiceSchema(this.app, this.data);
        } catch (err: any) {
            logError('[ERROR] [getSchema]', err);
            throw new ErrorResponse(err);
        }
    }

    public async setSchema(data: DSDataServiceSchema): Promise<DSDataService> {
        try {
            assignIn(this.data, data.getData());
            let resp = await httpRequest.put(this.api + '/' + this.data._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: this.createPayload()
            }) as any;
            assignIn(this.data, resp.body);
            return this;
        } catch (err: any) {
            logError('[ERROR] [setSchema]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public DataAPIs() {
        return new DataMethods(this.app, this.data);
    }

    // public WorkflowAPIs() {
    //     return new WorkflowMethods(this.app, this.data);
    // }

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
        this.api = `api/a/sm/${this.app._id}/service/${this.data._id}`;
    }

    public getData(): DataService {
        return this.data;
    }

    public listRoles(): RoleBlock[] {
        try {
            return this.data.role.roles;
        } catch (err: any) {
            logError('[ERROR] [listRoles]', err);
            throw new ErrorResponse(err);
        }
    }

    public getRole(name: string): RoleBlock | undefined {
        try {
            return this.data.role.roles.find(e => e.name === name);
        } catch (err: any) {
            logError('[ERROR] [getRole]', err);
            throw new ErrorResponse(err);
        }
    }

    public createNewRole(name: string, description?: string): RoleBlock {
        try {
            const temp = new RoleBlock();
            temp.setName(name);
            temp.setDescription(description);
            return temp;
        } catch (err: any) {
            logError('[ERROR] [createNewRole]', err);
            throw new ErrorResponse(err);
        }
    }

    public addRole(data: RoleBlock): DSDataServiceRole {
        try {
            if (!(data instanceof RoleBlock)) {
                throw new Error('Please create a new role first');
            }
            this.data.role.roles.push(data);
            return this;
        } catch (err: any) {
            logError('[ERROR] [addRole]', err);
            throw new ErrorResponse(err);
        }
    }

    public removeRole(name: string): DSDataServiceRole {
        try {
            const index = this.data.role.roles.findIndex(e => e.name === name);
            this.data.role.roles.splice(index, 1);
            return this;
        } catch (err: any) {
            logError('[ERROR] [removeRole]', err);
            throw new ErrorResponse(err);
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
        this.api = `api/a/sm/${this.app._id}/service/${this.data._id}`;
    }

    public getData(): DataService {
        return this.data;
    }

    public listPreHook(): WebHook[] {
        try {
            return this.data.preHooks;
        } catch (err: any) {
            logError('[ERROR] [listPreHook]', err);
            throw new ErrorResponse(err);
        }
    }

    public getPreHook(name: string): WebHook | undefined {
        try {
            return this.data.preHooks.find(e => e.name === name);
        } catch (err: any) {
            logError('[ERROR] [getPreHook]', err);
            throw new ErrorResponse(err);
        }
    }

    public addPreHook(data: WebHook): DSDataServiceIntegration {
        try {
            this.data.preHooks.push(data);
            return this;
        } catch (err: any) {
            logError('[ERROR] [addPreHook]', err);
            throw new ErrorResponse(err);
        }
    }

    public removePreHook(name: string): DSDataServiceIntegration {
        try {
            const index = this.data.preHooks.findIndex(e => e.name === name);
            this.data.preHooks.splice(index, 1);
            return this;
        } catch (err: any) {
            logError('[ERROR] [removePreHook]', err);
            throw new ErrorResponse(err);
        }
    }

    public listPostHook(): WebHook[] {
        try {
            return this.data.webHooks;
        } catch (err: any) {
            logError('[ERROR] [listPostHook]', err);
            throw new ErrorResponse(err);
        }
    }

    public getPostHook(name: string): WebHook | undefined {
        try {
            return this.data.webHooks.find(e => e.name === name);
        } catch (err: any) {
            logError('[ERROR] [getPostHook]', err);
            throw new ErrorResponse(err);
        }
    }

    public addPostHook(data: WebHook): DSDataServiceIntegration {
        try {
            this.data.webHooks.push(data);
            return this;
        } catch (err: any) {
            logError('[ERROR] [addPostHook]', err);
            throw new ErrorResponse(err);
        }
    }

    public removePostHook(name: string): DSDataServiceIntegration {
        try {
            const index = this.data.webHooks.findIndex(e => e.name === name);
            this.data.webHooks.splice(index, 1);
            return this;
        } catch (err: any) {
            logError('[ERROR] [removePostHook]', err);
            throw new ErrorResponse(err);
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
        this.api = `api/a/sm/${this.app._id}/service/${this.data._id}`;
    }

    public getData(): DataService {
        return this.data;
    }

    // public getJSONSchema() {
    //     try {
    //         return this.data.preHooks;
    //     } catch (err: any) {
    //         logError('[ERROR] [getJSONSchema]', err);
    //         throw new ErrorResponse(err);
    //     }
    // }

    // public setJSONSchema(schema: any) {
    //     try {
    //         return this.data.preHooks;
    //     } catch (err: any) {
    //         logError('[ERROR] [setJSONSchema]', err);
    //         throw new ErrorResponse(err);
    //     }
    // }

    public newField(data?: SchemaField): SchemaField {
        try {
            return new SchemaField(data);
        } catch (err: any) {
            logError('[ERROR] [newField]', err);
            throw new ErrorResponse(err);
        }
    }

    public getField(name: string): SchemaField | undefined {
        try {
            return this.data.definition.find(e => e.getName() === name);
        } catch (err: any) {
            logError('[ERROR] [getField]', err);
            throw new ErrorResponse(err);
        }
    }

    public addField(data: SchemaField) {
        try {
            this.data.definition.push(data);
            return this;
        } catch (err: any) {
            logError('[ERROR] [addField]', err);
            throw new ErrorResponse(err);
        }
    }

    public patchField(data: SchemaField) {
        try {
            this.data.definition.push(data);
            return this;
        } catch (err: any) {
            logError('[ERROR] [patchField]', err);
            throw new ErrorResponse(err);
        }
    }

    public removeField(name: string) {
        try {
            const index = this.data.preHooks.findIndex(e => e.name === name);
            this.data.preHooks.splice(index, 1);
            return this;
        } catch (err: any) {
            logError('[ERROR] [removeField]', err);
            throw new ErrorResponse(err);
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
        this.api = 'api/c/' + this.app._id + this.data.api;
    }

    public NewDocument(data?: any) {
        return new DataStackDocument(data);
    }

    public async CountRecords(filter?: any): Promise<number> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('countOnly', 'true');
            if (filter) {
                searchParams.append('filter', JSON.stringify(filter));
            }
            let resp = await httpRequest.get(this.api, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                searchParams
            }) as any;
            return resp.body;
        } catch (err: any) {
            logError('[ERROR] [CountRecords]', err);
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
            let resp = await httpRequest.get(this.api, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                searchParams: searchParams,
                responseType: 'json',
            }) as any;
            return resp.body.map((item: any) => {
                return new DataStackDocument(item);
            });
        } catch (err: any) {
            logError('[ERROR] [ListRecords]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async GetRecord(id: string): Promise<DataStackDocument> {
        try {
            let resp = await httpRequest.get(this.api + '/' + id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            }) as any;
            return new DataStackDocument(resp.body);
        } catch (err: any) {
            logError('[ERROR] [GetRecord]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async UpdateRecord(id: string, data: any, options?: { expireAt?: string | number, expireAfter?: string, filter?: any, useFilter?: boolean }): Promise<DataStackDocument> {
        try {
            let url = this.api + '/' + id;
            const params = [];
            if (options) {
                if (options.expireAfter !== null || options.expireAfter !== undefined) {
                    params.push(`expireAfter=${options.expireAfter}`);
                }
                if (options.expireAt !== null || options.expireAt !== undefined) {
                    params.push(`expireAt=${options.expireAt}`);
                }
                if (options.useFilter !== null || options.useFilter !== undefined) {
                    params.push(`useFilter=${options.useFilter}`);
                }
                if (options.filter !== null || options.filter !== undefined) {
                    params.push(`filter=${JSON.stringify(options.filter)}`);
                }
            }
            if (params.length > 0) {
                url += '?' + params.join('&');
            }
            let resp = await httpRequest.put(url, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: data
            }) as any;
            return new DataStackDocument(resp.body);
        } catch (err: any) {
            logError('[ERROR] [UpdateRecord]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async UpsertRecord(id: string, data: any, options?: { expireAt?: string | number, expireAfter?: string, filter?: any, useFilter?: boolean }): Promise<DataStackDocument> {
        try {
            let url = this.api + '/' + id;
            const params = ['upsert=true'];
            if (options) {
                if (options.expireAfter !== null || options.expireAfter !== undefined) {
                    params.push(`expireAfter=${options.expireAfter}`);
                }
                if (options.expireAt !== null || options.expireAt !== undefined) {
                    params.push(`expireAt=${options.expireAt}`);
                }
                if (options.useFilter !== null || options.useFilter !== undefined) {
                    params.push(`useFilter=${options.useFilter}`);
                }
                if (options.filter !== null || options.filter !== undefined) {
                    params.push(`filter=${JSON.stringify(options.filter)}`);
                }
            }
            if (params.length > 0) {
                url += '?' + params.join('&');
            }
            let resp = await httpRequest.put(url, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: data
            }) as any;
            return new DataStackDocument(resp.body);
        } catch (err: any) {
            logError('[ERROR] [UpsertRecord]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async CreateRecord(data: any, options?: { expireAt: string | number, expireAfter: string }): Promise<DataStackDocument> {
        try {
            let url = this.api;
            const params = [];
            if (options) {
                if (options.expireAfter !== null || options.expireAfter !== undefined) {
                    params.push(`expireAfter=${options.expireAfter}`);
                }
                if (options.expireAt !== null || options.expireAt !== undefined) {
                    params.push(`expireAt=${options.expireAt}`);
                }
            }
            if (params.length > 0) {
                url += '?' + params.join('&');
            }
            let resp = await httpRequest.post(url, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: data
            }) as any;
            return new DataStackDocument(resp.body);
        } catch (err: any) {
            logError('[ERROR] [CreateRecord]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async DeleteRecord(id: string): Promise<ErrorResponse> {
        try {
            let resp = await httpRequest.delete(this.api + '/' + id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            return new SuccessResponse(resp.body);
        } catch (err: any) {
            logError('[ERROR] [DeleteRecord]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async BulkDeleteRecords(options: { ids?: string[], filter?: any }): Promise<ErrorResponse> {
        try {
            let url = this.api + '/utils/bulkDelete';
            const params = [];
            if (options) {
                if (options.ids !== null || options.ids !== undefined) {
                    params.push(`ids=${options.ids}`);
                }
                if (options.filter !== null || options.filter !== undefined) {
                    params.push(`filter=${JSON.stringify(options.filter)}`);
                }
            }
            if (params.length > 0) {
                url += '?' + params.join('&');
            }
            let resp = await httpRequest.delete(url, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: {}
            }) as any;
            return new SuccessResponse(resp.body);
        } catch (err: any) {
            logError('[ERROR] [BulkDeleteRecords]', err);
            throw new ErrorResponse(err.response);
        }
    }

    // public async BulkUpdateRecord(options: { keys: string[], filter?: any, docs?: any[], data?: any, expireAt?: string | number, expireAfter?: string }): Promise<DataStackDocument> {
    //     try {
    //         let url = this.api + '/utils/bulkUpdate';
    //         const params = [];
    //         if (options) {
    //             if (options.expireAfter !== null || options.expireAfter !== undefined) {
    //                 params.push(`expireAfter=${options.expireAfter}`);
    //             }
    //             if (options.expireAt !== null || options.expireAt !== undefined) {
    //                 params.push(`expireAt=${options.expireAt}`);
    //             }
    //         }
    //         delete options.expireAfter;
    //         delete options.expireAt;
    //         if (params.length > 0) {
    //             url += '?' + params.join('&');
    //         }
    //         let resp = await httpRequest.put(url, {
    //             headers: {
    //                 Authorization: 'JWT ' + authData.token
    //             },
    //             responseType: 'json',
    //             json: options
    //         }) as any;
    //         return new DataStackDocument(resp.body);
    //     } catch (err: any) {
    //         logError('[ERROR] [UpdateRecord]', err);
    //         throw new ErrorResponse(err.response);
    //     }
    // }

    public PrepareMath(): MathAPI {
        try {
            return new MathAPI();
        } catch (err: any) {
            logError('[ERROR] [PrepareMath]', err);
            throw new ErrorResponse(err);
        }
    }

    public async ApplyMath(id: string, math: MathAPI): Promise<DataStackDocument> {
        try {
            let resp = await httpRequest.put(this.api + '/' + id + '/math', {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: math.CreatePayload()
            }) as any;
            return new DataStackDocument(resp.body);
        } catch (err: any) {
            logError('[ERROR] [ApplyMath]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async UploadFileFromPath(filePath: string) {
        try {
            const form = new FormData();
            form.append('file', createReadStream(filePath));
            let resp = await httpRequest.post(this.api + '/utils/file/upload', {
                headers: {
                    Authorization: 'JWT ' + authData.token,
                },
                body: form,
                responseType: 'json'
            }) as any;
            return new FileUploadResponse(resp.body);
        } catch (err: any) {
            logError('[ERROR] [UploadFileFromPath]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async UploadFileAsStream(data: any) {
        try {
            const form = new FormData();
            form.append('file', data);
            let resp = await httpRequest.post(this.api + '/utils/file/upload', {
                headers: {
                    Authorization: 'JWT ' + authData.token,
                },
                body: form,
                responseType: 'json'
            }) as any;
            return new FileUploadResponse(resp.body);
        } catch (err: any) {
            logError('[ERROR] [UploadFileAsStream]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async DownloadFileAsStream(data: any) {
        try {
            let resp = await httpRequest.stream(this.api + '/utils/file/download/' + data.filename, {
                isStream: true,
                headers: {
                    Authorization: 'JWT ' + authData.token,
                }
            }) as any;
            return resp;
        } catch (err: any) {
            logError('[ERROR] [UploadFileAsStream]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async AggregatePipeline(pipeline: any[]) {
        try {
            let resp = await httpRequest.post(this.api + '/utils/aggregate', {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: pipeline
            }) as any;
            return resp.body;
        } catch (err: any) {
            logError('[ERROR] [AggregatePipeline]', err);
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

export class WorkflowMethods {
    app: App;
    data: DataService;
    api: string;
    constructor(app: App, data: DataService) {
        this.app = app;
        this.data = data;
        this.api = 'api/c/' + this.app._id + this.data.api + '/utils/workflow';
    }

    private async getPendingRecordIdsOfUser(user: string) {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('select', '_id');
            searchParams.append('count', '-1');
            searchParams.append('filter', JSON.stringify({ requestedBy: user, status: 'Pending' }));
            let resp = await httpRequest.get(this.api + '/action?app=' + this.app._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                searchParams: searchParams,
                responseType: 'json',
            }) as any;
            return resp.body.map((e: any) => e._id);
        } catch (err: any) {
            logError('[ERROR] [getPendingRecordIdsOfUser]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public CreateRespondData(): WorkflowRespond {
        return new WorkflowRespond();
    }

    public async ApproveRecords(ids: string[], respondData: WorkflowRespond): Promise<SuccessResponse | ErrorResponse> {
        try {
            if (!respondData) {
                respondData = new WorkflowRespond();
            }
            const payload = respondData.CreatePayload();
            payload.action = WorkflowActions.APPROVE;
            payload.ids = ids;
            let resp = await httpRequest.put(this.api + '/action?app=' + this.app._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: payload
            }) as any;
            return resp.body;
        } catch (err: any) {
            logError('[ERROR] [ApproveRecords]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async RejectRecords(ids: string[], respondData: WorkflowRespond): Promise<SuccessResponse | ErrorResponse> {
        try {
            if (!respondData) {
                respondData = new WorkflowRespond();
            }
            const payload = respondData.CreatePayload();
            payload.action = WorkflowActions.REJECT;
            payload.ids = ids;
            let resp = await httpRequest.put(this.api + '/action?app=' + this.app._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: payload
            }) as any;
            return resp.body;
        } catch (err: any) {
            logError('[ERROR] [RejectRecords]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async ReworkRecords(ids: string[], respondData: WorkflowRespond): Promise<SuccessResponse | ErrorResponse> {
        try {
            if (!respondData) {
                respondData = new WorkflowRespond();
            }
            const payload = respondData.CreatePayload();
            payload.action = WorkflowActions.REWORK;
            payload.ids = ids;
            let resp = await httpRequest.put(this.api + '/action?app=' + this.app._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: payload
            }) as any;
            return resp.body;
        } catch (err: any) {
            logError('[ERROR] [ReworkRecords]', err);
            throw new ErrorResponse(err.response);
        }
    }



    public async ApproveRecordsRequestedBy(user: string, respondData: WorkflowRespond): Promise<SuccessResponse | ErrorResponse> {
        try {
            if (!respondData) {
                respondData = new WorkflowRespond();
            }
            const payload = respondData.CreatePayload();
            payload.action = WorkflowActions.APPROVE;
            payload.ids = await this.getPendingRecordIdsOfUser(user);
            let resp = await httpRequest.put(this.api + '/action?app=' + this.app._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: payload
            }) as any;
            return resp.body;
        } catch (err: any) {
            logError('[ERROR] [ApproveRecordsRequestedBy]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async RejectRecordsRequestedBy(user: string, respondData: WorkflowRespond): Promise<SuccessResponse | ErrorResponse> {
        try {
            if (!respondData) {
                respondData = new WorkflowRespond();
            }
            const payload = respondData.CreatePayload();
            payload.action = WorkflowActions.REJECT;
            payload.ids = await this.getPendingRecordIdsOfUser(user);
            let resp = await httpRequest.put(this.api + '/action?app=' + this.app._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: payload
            }) as any;
            return resp.body;
        } catch (err: any) {
            logError('[ERROR] [RejectRecordsRequestedBy]', err);
            throw new ErrorResponse(err.response);
        }
    }

    public async ReworkRecordsRequestedBy(user: string, respondData: WorkflowRespond): Promise<SuccessResponse | ErrorResponse> {
        try {
            if (!respondData) {
                respondData = new WorkflowRespond();
            }
            const payload = respondData.CreatePayload();
            payload.action = WorkflowActions.REWORK;
            payload.ids = await this.getPendingRecordIdsOfUser(user);
            let resp = await httpRequest.put(this.api + '/action?app=' + this.app._id, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: payload
            }) as any;
            return resp.body;
        } catch (err: any) {
            logError('[ERROR] [ReworkRecordsRequestedBy]', err);
            throw new ErrorResponse(err.response);
        }
    }
}


export class TransactionMethods {
    app: App;
    api: string;
    private dataServiceMap: any;
    private payload: Array<any>;
    constructor(app: App, dataServiceMap: any) {
        this.app = app;
        this.dataServiceMap = dataServiceMap;
        this.api = 'api/common/txn?app=' + this.app._id;
        this.payload = [];
    }

    public CreateOperation(dataService: string, data: DataStackDocument): TransactionMethods {
        const temp: any = {};
        temp.operation = 'POST';
        temp.data = data;
        temp.dataService = {
            name: dataService,
            app: this.app._id
        };
        this.payload.push(temp);
        return this;
    }

    public UpdateOperation(dataService: string, data: DataStackDocument, upsert?: boolean): TransactionMethods {
        const temp: any = {};
        temp.operation = 'PUT';
        temp.data = data;
        temp.upsert = upsert || false;
        temp.dataService = {
            name: dataService,
            app: this.app._id
        };
        this.payload.push(temp);
        return this;
    }

    public DeleteOperation(dataService: string, data: DataStackDocument): TransactionMethods {
        const temp: any = {};
        temp.operation = 'DELETE';
        temp.data = data;
        temp.dataService = {
            name: dataService,
            app: this.app._id
        };
        this.payload.push(temp);
        return this;
    }

    public async Execute(): Promise<any | ErrorResponse> {
        try {
            let resp = await httpRequest.post(this.api, {
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json',
                json: this.payload
            }) as any;
            this.payload = [];
            return resp.body;
        } catch (err: any) {
            this.payload = [];
            logError('[ERROR] [Execute]', err);
            throw new ErrorResponse(err.response);
        }
    }
}

export default { authenticateByCredentials, authenticateByToken };
