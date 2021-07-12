"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathAPI = exports.DataMethods = exports.DSDataServiceSchema = exports.DSDataServiceIntegration = exports.DSDataServiceRole = exports.DSDataService = exports.DSApp = exports.DataStack = exports.authenticateByToken = exports.authenticateByCredentials = void 0;
const got_1 = __importDefault(require("got"));
const lodash_1 = require("lodash");
const rxjs_1 = require("rxjs");
const log4js_1 = require("log4js");
const types_1 = require("./types");
var authData;
var logger = log4js_1.getLogger('@appveen/ds-sdk');
logger.level = process.env.LOG_LEVEL || 'info';
function authenticateByCredentials(creds) {
    authData = new AuthHandler(creds);
    return authData.login();
}
exports.authenticateByCredentials = authenticateByCredentials;
function authenticateByToken(creds) {
    authData = new AuthHandler(creds);
    return authData.authenticateByToken();
}
exports.authenticateByToken = authenticateByToken;
function logError(message, err) {
    if (err) {
        if (err.response) {
            logger.error(message, err.response.statusCode, err.response.body);
        }
        else {
            logger.error(message, err);
        }
    }
    else {
        logger.error(message);
    }
}
class AuthHandler {
    constructor(creds) {
        this.rbacBotTokenDuration = 600;
        this.rbacHbInterval = 60;
        this.rbacUserCloseWindowToLogout = false;
        this.rbacUserToSingleSession = false;
        this.rbacUserTokenDuration = 600;
        this.rbacUserTokenRefresh = false;
        this.bot = false;
        this.creds = new types_1.Credentials(creds);
        this.api = this.creds.host + '/api/a/rbac';
        this.defaultTimezone = 'Zulu';
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger.info('Authenticating at:', this.creds.host);
                logger.info('Using Username:', this.creds.username);
                const payload = { username: this.creds.username, password: this.creds.password };
                const resp = yield got_1.default.post(this.api + '/login', { json: payload, responseType: 'json' });
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
                return new DataStack();
            }
            catch (err) {
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    authenticateByToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const resp = yield got_1.default.get(this.api + '/check', { responseType: 'json' });
                const data = resp.body;
                this.patchData(data);
                if (this.rbacUserToSingleSession || this.rbacUserCloseWindowToLogout) {
                    this.createHBRoutine();
                }
                if (this.rbacUserTokenRefresh) {
                    this.createTokenRefreshRoutine();
                }
                return new DataStack();
            }
            catch (err) {
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    createHBRoutine() {
        return __awaiter(this, void 0, void 0, function* () {
            const intervalValue = (this.rbacHbInterval * 1000) - 1000;
            this.hbRoutine = rxjs_1.interval(intervalValue).subscribe(() => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                logger.info('[HB Triggred]');
                logger.debug(this.token, this.uuid);
                try {
                    let resp = yield got_1.default.put(this.api + '/usr/hb', {
                        headers: {
                            Authorization: 'JWT ' + this.token
                        },
                        responseType: 'json',
                        json: {
                            uuid: this.uuid
                        }
                    });
                    const data = resp.body;
                    this.patchData(data);
                }
                catch (err) {
                    if (err.response.statusCode === 401) {
                        if (((_a = this.creds) === null || _a === void 0 ? void 0 : _a.username) && ((_b = this.creds) === null || _b === void 0 ? void 0 : _b.password)) {
                            this.login();
                        }
                        if (this.hbRoutine) {
                            this.hbRoutine.unsubscribe();
                        }
                    }
                    logError('[ERROR] [createHBRoutine]', err);
                }
            }));
        });
    }
    createTokenRefreshRoutine() {
        let intervalValue = (this.rbacUserTokenDuration - (5 * 60)) * 1000;
        if (this.bot) {
            intervalValue = (this.rbacBotTokenDuration - (5 * 60)) * 1000;
        }
        this.refreshRoutine = rxjs_1.interval(intervalValue).subscribe(() => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            logger.info('[Refresh Triggred]');
            logger.debug(this.token, this.rToken);
            try {
                let resp = yield got_1.default.get(this.api + '/refresh', {
                    headers: {
                        rToken: 'JWT ' + this.rToken,
                        Authorization: 'JWT ' + this.token
                    },
                    responseType: 'json'
                });
                const data = resp.body;
                this.patchData(data);
            }
            catch (err) {
                if (err.response.statusCode === 401) {
                    if (((_a = this.creds) === null || _a === void 0 ? void 0 : _a.username) && ((_b = this.creds) === null || _b === void 0 ? void 0 : _b.password)) {
                        this.login();
                    }
                    if (this.refreshRoutine) {
                        this.refreshRoutine.unsubscribe();
                    }
                }
                logError('[ERROR] [createTokenRefreshRoutine]', err);
            }
        }));
    }
    patchData(data) {
        this._id = data === null || data === void 0 ? void 0 : data._id;
        this.uuid = data === null || data === void 0 ? void 0 : data.uuid;
        this.token = data === null || data === void 0 ? void 0 : data.token;
        this.rToken = data === null || data === void 0 ? void 0 : data.rToken;
        this.expiresIn = data === null || data === void 0 ? void 0 : data.expiresIn;
        this.rbacBotTokenDuration = (data === null || data === void 0 ? void 0 : data.rbacBotTokenDuration) || 600;
        this.rbacHbInterval = (data === null || data === void 0 ? void 0 : data.rbacHbInterval) || 60;
        this.rbacUserCloseWindowToLogout = (data === null || data === void 0 ? void 0 : data.rbacUserCloseWindowToLogout) || false;
        this.rbacUserToSingleSession = (data === null || data === void 0 ? void 0 : data.rbacUserToSingleSession) || false;
        this.rbacUserTokenDuration = (data === null || data === void 0 ? void 0 : data.rbacUserTokenDuration) || 600;
        this.rbacUserTokenRefresh = (data === null || data === void 0 ? void 0 : data.rbacUserTokenRefresh) || false;
        this.serverTime = data === null || data === void 0 ? void 0 : data.serverTime;
        this.bot = data === null || data === void 0 ? void 0 : data.bot;
        this.defaultTimezone = (data === null || data === void 0 ? void 0 : data.defaultTimezone) || 'Zulu';
    }
}
class DataStack {
    constructor() {
        this.api = authData.creds.host + '/api/a/rbac/app';
    }
    ListApps() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchParams = new URLSearchParams();
                searchParams.append('count', '-1');
                let resp = yield got_1.default.get(this.api, {
                    searchParams: searchParams,
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                return resp.body.map((item) => {
                    return new DSApp(item);
                });
            }
            catch (err) {
                logError('[ERROR] [ListApps]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    App(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.get(this.api + '/' + name, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                return new DSApp(resp.body);
            }
            catch (err) {
                logError('[ERROR] [App]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    CreateApp(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.post(this.api, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {
                        _id: name,
                        defaultTimezone: authData.defaultTimezone,
                    }
                });
                return new DSApp(resp.body);
            }
            catch (err) {
                logError('[ERROR] [CreateApp]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    DeleteApp(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.delete(this.api + '/' + name, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                return this;
            }
            catch (err) {
                logError('[ERROR] [DeleteApp]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
}
exports.DataStack = DataStack;
class DSApp {
    constructor(app) {
        this.app = new types_1.App(app);
        this.api = authData.creds.host + '/api/a/sm/service';
        this.managementAPIs = {
            serviceStop: authData.creds.host + '/api/a/sm/' + this.app._id + '/service/stop',
            serviceStart: authData.creds.host + '/api/a/sm/' + this.app._id + '/service/start'
        };
    }
    RepairAllDataServices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filter = { app: this.app._id };
                let searchParams = new URLSearchParams();
                searchParams.append('filter', JSON.stringify(filter));
                searchParams.append('count', '-1');
                const resp = yield got_1.default.get(authData.creds.host + '/api/a/sm/service', {
                    searchParams: searchParams,
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                if (resp.body && resp.body.length > 0) {
                    let promises = resp.body.map((e) => __awaiter(this, void 0, void 0, function* () {
                        logger.info('Repairing Data Service', e._id);
                        let resp = yield got_1.default.put(authData.creds.host + `/api/a/sm/${e._id}/repair`, {
                            headers: {
                                Authorization: 'JWT ' + authData.token
                            },
                            responseType: 'json',
                            json: {}
                        });
                        return new types_1.SuccessResponse(resp.body);
                    }));
                    promises = yield Promise.all(promises);
                    return promises;
                }
                else {
                    return [];
                }
            }
            catch (err) {
                logError('[ERROR] [StartAllDataServices]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    StartAllDataServices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.put(this.managementAPIs.serviceStart, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {},
                });
                return this;
            }
            catch (err) {
                logError('[ERROR] [StartAllDataServices]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    StopAllDataServices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.put(this.managementAPIs.serviceStop, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {},
                });
                return this;
            }
            catch (err) {
                logError('[ERROR] [StopAllDataServices]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    ListDataServices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filter = { app: this.app._id };
                const searchParams = new URLSearchParams();
                searchParams.append('filter', JSON.stringify(filter));
                searchParams.append('count', '-1');
                let resp = yield got_1.default.get(this.api, {
                    searchParams: searchParams,
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                return resp.body.map((item) => {
                    new DSDataService(this.app, item);
                });
            }
            catch (err) {
                logError('[ERROR] [ListDataServices]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    SearchDataServices(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchParams = new URLSearchParams();
                if (!options) {
                    options = new types_1.ListOptions();
                }
                if (options.filter) {
                    options.filter.app = this.app._id;
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
                }
                else {
                    searchParams.append('count', '30');
                }
                let resp = yield got_1.default.get(this.api, {
                    searchParams: searchParams,
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                return resp.body.map((item) => {
                    new DSDataService(this.app, item);
                });
            }
            catch (err) {
                logError('[ERROR] [ListDataServices]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    DataService(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filter = { app: this.app._id, $or: [{ name }, { _id: name }] };
                const searchParams = new URLSearchParams();
                searchParams.append('filter', JSON.stringify(filter));
                let resp = yield got_1.default.get(this.api, {
                    searchParams: searchParams,
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                if (Array.isArray(resp.body)) {
                    return new DSDataService(this.app, resp.body[0]);
                }
                else {
                    return new DSDataService(this.app, resp.body);
                }
            }
            catch (err) {
                logError('[ERROR] [DataService]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    CreateDataService(name, description) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.post(this.api, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {
                        name,
                        description
                    }
                });
                return new DSDataService(this.app, resp.body);
            }
            catch (err) {
                logError('[ERROR] [CreateDataService]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
}
exports.DSApp = DSApp;
class DSDataService {
    constructor(app, data) {
        this.app = new types_1.App(app);
        this.data = new types_1.DataService(data);
        this.originalData = new types_1.DataService(data);
        this.api = authData.creds.host + `/api/a/sm/${this.data._id}`;
        this.smApi = authData.creds.host + `/api/a/sm/service`;
        this._isDraft = false;
        if (this.data.HasDraft()) {
            this.FetchDraft();
        }
    }
    FetchDraft() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchParams = new URLSearchParams();
                searchParams.append('draft', 'true');
                let resp = yield got_1.default.get(this.smApi + '/' + this.data._id, {
                    searchParams,
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                this.draftData = new types_1.DataService(resp.body);
            }
            catch (err) {
                logError('[ERROR] [FetchDraft]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    HasDraft() {
        try {
            return this.data.HasDraft();
        }
        catch (err) {
            logError('[ERROR] [HasDraft]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    IsDraft() {
        try {
            return this._isDraft;
        }
        catch (err) {
            logError('[ERROR] [IsDraft]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    SwitchToDraft() {
        try {
            if (this.draftData) {
                this._isDraft = true;
                this.data = new types_1.DataService(this.draftData);
            }
            return this;
        }
        catch (err) {
            logError('[ERROR] [SwitchToDraft]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    SwitchToOriginal() {
        try {
            this._isDraft = false;
            this.data = new types_1.DataService(this.originalData);
            return this;
        }
        catch (err) {
            logError('[ERROR] [SwitchToOriginal]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    DiscardDraft() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.delete(this.api + '/draftDelete', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                resp = (yield got_1.default.get(this.smApi + '/' + this.data._id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                }));
                this.data = new types_1.DataService(this.originalData);
                this.draftData = undefined;
                return this;
            }
            catch (err) {
                logError('[ERROR] [DiscardDraft]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    PurgeAllData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.delete(this.api + '/purge/all', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                return this;
            }
            catch (err) {
                logError('[ERROR] [PurgeAllData]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    PurgeApiLogs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.delete(this.api + '/purge/log', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                return this;
            }
            catch (err) {
                logError('[ERROR] [PurgeApiLogs]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    PurgeAuditLogs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.delete(this.api + '/purge/audit', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                return this;
            }
            catch (err) {
                logError('[ERROR] [PurgeAuditLogs]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    Delete() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.delete(this.smApi + '/' + this.data._id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                return new DSApp(this.app);
            }
            catch (err) {
                logError('[ERROR] [Delete]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    Start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.put(this.api + '/start', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                return new types_1.SuccessResponse(resp.body);
            }
            catch (err) {
                logError('[ERROR] [Start]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    Stop() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.put(this.api + '/stop', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                return new types_1.SuccessResponse(resp.body);
            }
            catch (err) {
                logError('[ERROR] [Stop]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    ScaleUp() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.put(this.api + '/start', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                return new types_1.SuccessResponse(resp.body);
            }
            catch (err) {
                logError('[ERROR] [ScaleUp]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    ScaleDown() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.put(this.api + '/stop', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                return new types_1.SuccessResponse(resp.body);
            }
            catch (err) {
                logError('[ERROR] [ScaleDown]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    Repair() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.put(this.api + '/repair', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                return new types_1.SuccessResponse(resp.body);
            }
            catch (err) {
                logError('[ERROR] [Repair]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    getIntegrations() {
        try {
            return new DSDataServiceIntegration(this.app, this.data);
        }
        catch (err) {
            logError('[ERROR] [getIntegrations]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    setIntegrations(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                lodash_1.assignIn(this.data, data.getData());
                let resp = yield got_1.default.put(this.smApi + '/' + this.data._id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: this.createPayload()
                });
                lodash_1.assignIn(this.data, resp.body);
                return this;
            }
            catch (err) {
                logError('[ERROR] [setIntegrations]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    getRoles() {
        try {
            return new DSDataServiceRole(this.app, this.data);
        }
        catch (err) {
            logError('[ERROR] [getRoles]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    setRoles(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                lodash_1.assignIn(this.data, data.getData());
                let resp = yield got_1.default.put(this.smApi + '/' + this.data._id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: this.createPayload()
                });
                lodash_1.assignIn(this.data, resp.body);
                return this;
            }
            catch (err) {
                logError('[ERROR] [setRoles]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    getSchema() {
        try {
            return new DSDataServiceSchema(this.app, this.data);
        }
        catch (err) {
            logError('[ERROR] [getSchema]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    setSchema(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                lodash_1.assignIn(this.data, data.getData());
                let resp = yield got_1.default.put(this.smApi + '/' + this.data._id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: this.createPayload()
                });
                lodash_1.assignIn(this.data, resp.body);
                return this;
            }
            catch (err) {
                logError('[ERROR] [setSchema]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    DataAPIs() {
        return new DataMethods(this.app, this.data);
    }
    createPayload() {
        const data = JSON.parse(JSON.stringify(this.data));
        this.cleanPayload(data.definition);
        return data;
    }
    cleanPayload(definition) {
        if (definition) {
            definition.forEach((item) => {
                if (item.type === 'Object' || item.type === 'Array') {
                    this.cleanPayload(item.definition);
                }
                else {
                    if (Array.isArray(item.properties.enum) && item.properties.enum.length == 0) {
                        delete item.properties.enum;
                    }
                    ;
                    if (Array.isArray(item.properties.tokens) && item.properties.tokens.length == 0) {
                        delete item.properties.tokens;
                    }
                    ;
                }
            });
        }
    }
}
exports.DSDataService = DSDataService;
class DSDataServiceRole {
    constructor(app, data) {
        this.app = app;
        this.data = data;
        this.api = authData.creds.host + `/api/a/sm/${this.data._id}`;
    }
    getData() {
        return this.data;
    }
    listRoles() {
        try {
            return this.data.role.roles;
        }
        catch (err) {
            logError('[ERROR] [listRoles]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    getRole(name) {
        try {
            return this.data.role.roles.find(e => e.name === name);
        }
        catch (err) {
            logError('[ERROR] [getRole]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    createNewRole(name, description) {
        try {
            const temp = new types_1.RoleBlock();
            temp.setName(name);
            temp.setDescription(description);
            return temp;
        }
        catch (err) {
            logError('[ERROR] [createNewRole]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    addRole(data) {
        try {
            if (!(data instanceof types_1.RoleBlock)) {
                throw new Error('Please create a new role first');
            }
            this.data.role.roles.push(data);
            return this;
        }
        catch (err) {
            logError('[ERROR] [addRole]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    removeRole(name) {
        try {
            const index = this.data.role.roles.findIndex(e => e.name === name);
            this.data.role.roles.splice(index, 1);
            return this;
        }
        catch (err) {
            logError('[ERROR] [removeRole]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
}
exports.DSDataServiceRole = DSDataServiceRole;
class DSDataServiceIntegration {
    constructor(app, data) {
        this.app = app;
        this.data = data;
        this.api = authData.creds.host + `/api/a/sm/${this.data._id}`;
    }
    getData() {
        return this.data;
    }
    listPreHook() {
        try {
            return this.data.preHooks;
        }
        catch (err) {
            logError('[ERROR] [listPreHook]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    getPreHook(name) {
        try {
            return this.data.preHooks.find(e => e.name === name);
        }
        catch (err) {
            logError('[ERROR] [getPreHook]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    addPreHook(data) {
        try {
            this.data.preHooks.push(data);
            return this;
        }
        catch (err) {
            logError('[ERROR] [addPreHook]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    removePreHook(name) {
        try {
            const index = this.data.preHooks.findIndex(e => e.name === name);
            this.data.preHooks.splice(index, 1);
            return this;
        }
        catch (err) {
            logError('[ERROR] [removePreHook]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    listPostHook() {
        try {
            return this.data.webHooks;
        }
        catch (err) {
            logError('[ERROR] [listPostHook]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    getPostHook(name) {
        try {
            return this.data.webHooks.find(e => e.name === name);
        }
        catch (err) {
            logError('[ERROR] [getPostHook]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    addPostHook(data) {
        try {
            this.data.webHooks.push(data);
            return this;
        }
        catch (err) {
            logError('[ERROR] [addPostHook]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    removePostHook(name) {
        try {
            const index = this.data.webHooks.findIndex(e => e.name === name);
            this.data.webHooks.splice(index, 1);
            return this;
        }
        catch (err) {
            logError('[ERROR] [removePostHook]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
}
exports.DSDataServiceIntegration = DSDataServiceIntegration;
class DSDataServiceSchema {
    constructor(app, data) {
        this.app = app;
        this.data = data;
        this.api = authData.creds.host + `/api/a/sm/${this.data._id}`;
    }
    getData() {
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
    newField(data) {
        try {
            return new types_1.SchemaField(data);
        }
        catch (err) {
            logError('[ERROR] [newField]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    getField(name) {
        try {
            return this.data.definition.find(e => e.getName() === name);
        }
        catch (err) {
            logError('[ERROR] [getField]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    addField(data) {
        try {
            this.data.definition.push(data);
            return this;
        }
        catch (err) {
            logError('[ERROR] [addField]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    patchField(data) {
        try {
            this.data.definition.push(data);
            return this;
        }
        catch (err) {
            logError('[ERROR] [patchField]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    removeField(name) {
        try {
            const index = this.data.preHooks.findIndex(e => e.name === name);
            this.data.preHooks.splice(index, 1);
            return this;
        }
        catch (err) {
            logError('[ERROR] [removeField]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
}
exports.DSDataServiceSchema = DSDataServiceSchema;
class DataMethods {
    constructor(app, data) {
        this.app = app;
        this.data = data;
        this.api = authData.creds.host + '/api/c/' + this.app._id + this.data.api;
    }
    CountRecords() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchParams = new URLSearchParams();
                searchParams.append('countOnly', 'true');
                let resp = yield got_1.default.get(this.api, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    searchParams
                });
                return resp.body;
            }
            catch (err) {
                logError('[ERROR] [CountRecords]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    ListRecords(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchParams = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.select) {
                    searchParams.append('select', options.select);
                }
                if (options === null || options === void 0 ? void 0 : options.sort) {
                    searchParams.append('sort', options.sort);
                }
                if (options === null || options === void 0 ? void 0 : options.count) {
                    searchParams.append('count', options.count.toString());
                }
                if (options === null || options === void 0 ? void 0 : options.page) {
                    searchParams.append('page', options.page.toString());
                }
                if (options === null || options === void 0 ? void 0 : options.expand) {
                    searchParams.append('expand', options.expand.toString());
                }
                if (options === null || options === void 0 ? void 0 : options.filter) {
                    searchParams.append('filter', JSON.stringify(options.filter));
                }
                let resp = yield got_1.default.get(this.api, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    searchParams: searchParams,
                    responseType: 'json',
                });
                return resp.body.map((item) => {
                    return new types_1.DataStackDocument(item);
                });
            }
            catch (err) {
                logError('[ERROR] [ListRecords]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    GetRecord(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.get(this.api + '/' + id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                return new types_1.DataStackDocument(resp.body);
            }
            catch (err) {
                logError('[ERROR] [GetRecord]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    UpdateRecord(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.put(this.api + '/' + id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: data
                });
                return new types_1.DataStackDocument(resp.body);
            }
            catch (err) {
                logError('[ERROR] [UpdateRecord]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    UpsertRecord(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.put(this.api + '/' + id + '?upsert=true', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: data
                });
                return new types_1.DataStackDocument(resp.body);
            }
            catch (err) {
                logError('[ERROR] [UpsertRecord]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    CreateRecord(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.post(this.api, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: data
                });
                return new types_1.DataStackDocument(resp.body);
            }
            catch (err) {
                logError('[ERROR] [CreateRecord]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    CascadeRecord(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.post(this.api + '?cascade=true', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: data
                });
                return new types_1.DataStackDocument(resp.body);
            }
            catch (err) {
                logError('[ERROR] [CascadeRecord]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    DeleteRecord(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.delete(this.api + '/' + id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                return new types_1.SuccessResponse(resp.body);
            }
            catch (err) {
                logError('[ERROR] [DeleteRecord]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    PrepareMath() {
        try {
            return new MathAPI();
        }
        catch (err) {
            logError('[ERROR] [PrepareMath]', err);
            throw new types_1.ErrorResponse(err);
        }
    }
    ApplyMath(id, math) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.put(this.api + '/' + id + '/math', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: math.CreatePayload()
                });
                return new types_1.DataStackDocument(resp.body);
            }
            catch (err) {
                logError('[ERROR] [ApplyMath]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
}
exports.DataMethods = DataMethods;
class MathAPI {
    constructor() {
        // this.operations = { $inc: {}, $mul: {} };
        this.operations = [];
    }
    SelectField(path) {
        this.selectedField = path;
        return this;
    }
    Increment(num) {
        if (!this.selectedField) {
            throw new Error('Please select the field first while using Math API');
        }
        // this.operations.$inc[this.selectedField] = num;
        this.operations.push({ $inc: { [this.selectedField]: num } });
        return this;
    }
    Multiply(num) {
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
exports.MathAPI = MathAPI;
exports.default = { authenticateByCredentials, authenticateByToken };
