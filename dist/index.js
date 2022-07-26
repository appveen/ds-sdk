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
exports.TransactionMethods = exports.WorkflowMethods = exports.MathAPI = exports.DataMethods = exports.DSDataServiceSchema = exports.DSDataServiceIntegration = exports.DSDataServiceRole = exports.DSDataService = exports.DSApp = exports.DataStack = exports.authenticateByToken = exports.authenticateByCredentials = void 0;
const got_1 = __importDefault(require("got"));
const form_data_1 = __importDefault(require("form-data"));
'form-data';
const lodash_1 = require("lodash");
const rxjs_1 = require("rxjs");
const log4js_1 = require("log4js");
const fs_1 = require("fs");
const types_1 = require("./types");
const version_1 = require("./version");
var authData;
var logger = log4js_1.getLogger(`[@appveen/ds-sdk] [${version_1.LIB_VERSION}]`);
logger.level = 'error';
function authenticateByCredentials(creds) {
    if (creds.trace) {
        logger.level = 'info';
    }
    if (creds.logger) {
        logger = creds.logger;
    }
    authData = new AuthHandler(creds);
    return authData.login();
}
exports.authenticateByCredentials = authenticateByCredentials;
function authenticateByToken(creds) {
    authData = new AuthHandler(creds);
    if (creds.trace) {
        logger.level = 'info';
    }
    if (creds.logger) {
        logger = creds.logger;
    }
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
        this.isSuperAdmin = false;
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger.info('Authenticating at:', this.creds.host);
                logger.info('Using Username:', this.creds.username);
                const payload = { username: this.creds.username, password: this.creds.password };
                const resp = yield got_1.default.post(this.api + '/auth/login', { json: payload, responseType: 'json' });
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
            }
            catch (err) {
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const resp = yield got_1.default.delete(this.api + '/auth/logout', { responseType: 'json' });
                logger.info('Logged out Successfull');
                this.clearRoutine();
            }
            catch (err) {
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    authenticateByToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const resp = yield got_1.default.get(this.api + '/auth/check', { responseType: 'json', headers: { authorization: this.creds.token } });
                const data = resp.body;
                this.patchData(data);
                if (this.rbacUserToSingleSession || this.rbacUserCloseWindowToLogout) {
                    this.createHBRoutine();
                }
                if (this.rbacUserTokenRefresh) {
                    this.createTokenRefreshRoutine();
                }
                return new DataStack(this);
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
                    let resp = yield got_1.default.put(this.api + '/auth/hb', {
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
                let resp = yield got_1.default.get(this.api + '/auth/refresh', {
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
    clearRoutine() {
        if (this.hbRoutine) {
            this.hbRoutine.unsubscribe();
        }
        if (this.refreshRoutine) {
            this.refreshRoutine.unsubscribe();
        }
    }
    patchData(data) {
        this._id = data === null || data === void 0 ? void 0 : data._id;
        this.uuid = data === null || data === void 0 ? void 0 : data.uuid;
        this.token = data === null || data === void 0 ? void 0 : data.token;
        this.rToken = data === null || data === void 0 ? void 0 : data.rToken;
        this.expiresIn = data === null || data === void 0 ? void 0 : data.expiresIn;
        this.isSuperAdmin = (data === null || data === void 0 ? void 0 : data.isSuperAdmin) || false;
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
    constructor(data) {
        this.api = authData.creds.host + '/api/a/rbac';
        this.authData = data;
    }
    Logout() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield authData.logout();
            }
            catch (err) {
                logError('[ERROR] [Logout]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    CountApps(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchParams = new URLSearchParams();
                if (filter) {
                    searchParams.append('filter', JSON.stringify(filter));
                }
                searchParams.append('countOnly', 'true');
                let resp = yield got_1.default.get(this.api + '/data/app/count', {
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
                logError('[ERROR] [CountApps]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    ListApps(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchParams = new URLSearchParams();
                if (options && options.filter) {
                    searchParams.append('filter', JSON.stringify(options.filter));
                }
                if (options && options.select) {
                    searchParams.append('select', options.select);
                }
                searchParams.append('count', '-1');
                let resp = yield got_1.default.get(this.api + '/data/app', {
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
                let resp = yield got_1.default.get(this.api + '/data/app/' + name, {
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
                if (!this.authData.isSuperAdmin) {
                    throw new types_1.ErrorResponse({ statusMessage: 'Only Super Admins Can Create an App' });
                }
                let resp = yield got_1.default.post(this.api + '/admin/app', {
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
                if (!this.authData.isSuperAdmin) {
                    throw new types_1.ErrorResponse({ statusMessage: 'Only Super Admins Can Delete an App' });
                }
                let resp = yield got_1.default.delete(this.api + '/admin/app/' + name, {
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
        this.api = authData.creds.host + `/api/a/sm/${this.app._id}/service`;
        this.dataServiceMap = {};
        this.CreateDataServiceMap();
    }
    CreateDataServiceMap() {
        return __awaiter(this, void 0, void 0, function* () {
            const searchParams = new URLSearchParams();
            searchParams.append('count', '-1');
            searchParams.append('select', '_id,name');
            let resp = yield got_1.default.get(this.api, {
                searchParams: searchParams,
                headers: {
                    Authorization: 'JWT ' + authData.token
                },
                responseType: 'json'
            });
            return resp.body.map((item) => {
                this.dataServiceMap[item.name] = item._id;
            });
        });
    }
    RepairAllDataServices(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let searchParams = new URLSearchParams();
                searchParams.append('count', '-1');
                searchParams.append('select', '_id,name');
                if (filter) {
                    searchParams.append('filter', JSON.stringify(filter));
                }
                const resp = yield got_1.default.get(this.api, {
                    searchParams: searchParams,
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                if (resp.body && resp.body.length > 0) {
                    let promises = resp.body.map((e) => __awaiter(this, void 0, void 0, function* () {
                        logger.info('Repairing Data Service', e._id);
                        let resp = yield got_1.default.put(this.api + `/utils/${e._id}/repair`, {
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
                logError('[ERROR] [RepairAllDataServices]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    StartAllDataServices(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let searchParams = new URLSearchParams();
                searchParams.append('count', '-1');
                searchParams.append('select', '_id,name');
                if (filter) {
                    searchParams.append('filter', JSON.stringify(filter));
                }
                const resp = yield got_1.default.get(this.api, {
                    searchParams: searchParams,
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                if (resp.body && resp.body.length > 0) {
                    let promises = resp.body.map((e) => __awaiter(this, void 0, void 0, function* () {
                        logger.info('Starting Data Service', e._id);
                        let resp = yield got_1.default.put(this.api + `/utils/${e._id}/start`, {
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
    StopAllDataServices(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let searchParams = new URLSearchParams();
                searchParams.append('count', '-1');
                searchParams.append('select', '_id,name');
                if (filter) {
                    searchParams.append('filter', JSON.stringify(filter));
                }
                const resp = yield got_1.default.get(this.api, {
                    searchParams: searchParams,
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                if (resp.body && resp.body.length > 0) {
                    let promises = resp.body.map((e) => __awaiter(this, void 0, void 0, function* () {
                        logger.info('Repairing Data Service', e._id);
                        let resp = yield got_1.default.put(this.api + `/utils/${e._id}/stop`, {
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
                logError('[ERROR] [StopAllDataServices]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    CountDataServices(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchParams = new URLSearchParams();
                if (filter) {
                    searchParams.append('filter', JSON.stringify(filter));
                }
                searchParams.append('countOnly', 'true');
                let resp = yield got_1.default.get(this.api + '/count', {
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
                logError('[ERROR] [CountDataServices]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    ListDataServices(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchParams = new URLSearchParams();
                if (!options) {
                    options = new types_1.ListOptions();
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
                    return new DSDataService(this.app, item);
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
                searchParams.append('count', '1');
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
    TransactionAPI() {
        return new TransactionMethods(this.app, this.dataServiceMap);
    }
}
exports.DSApp = DSApp;
class DSDataService {
    constructor(app, data) {
        this.app = new types_1.App(app);
        this.data = new types_1.DataService(data);
        this.originalData = new types_1.DataService(data);
        this.api = authData.creds.host + `/api/a/sm/${this.app._id}/service`;
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
                let resp = yield got_1.default.get(this.api + `/${this.data._id}`, {
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.delete(this.api + `/utils/${(_a = this.data) === null || _a === void 0 ? void 0 : _a._id}/draftDelete`, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                resp = (yield got_1.default.get(this.api + `/${this.data._id}`, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                }));
                this.originalData = resp.body;
                this.data = new types_1.DataService(resp.body);
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
                let resp = yield got_1.default.delete(this.api + `/utils/${this.data._id}/purge/all`, {
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
                let resp = yield got_1.default.delete(this.api + `/utils/${this.data._id}/purge/log`, {
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
                let resp = yield got_1.default.delete(this.api + `/utils/${this.data._id}/purge/audit`, {
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
                let resp = yield got_1.default.delete(this.api + '/' + this.data._id, {
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
    Yamls() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.get(this.api + `/utils/${this.data._id}/yamls`, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                return new types_1.Yamls(resp.body);
            }
            catch (err) {
                logError('[ERROR] [Yamls]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    Start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.put(this.api + `/utils/${this.data._id}/start`, {
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
                let resp = yield got_1.default.put(this.api + `/utils/${this.data._id}/stop`, {
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
                let resp = yield got_1.default.put(this.api + `/utils/${this.data._id}/start`, {
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
                let resp = yield got_1.default.put(this.api + `/utils/${this.data._id}/stop`, {
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
                let resp = yield got_1.default.put(this.api + `/utils/${this.data._id}/repair`, {
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
                let resp = yield got_1.default.put(this.api + '/' + this.data._id, {
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
                let resp = yield got_1.default.put(this.api + '/' + this.data._id, {
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
                let resp = yield got_1.default.put(this.api + '/' + this.data._id, {
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
    // public WorkflowAPIs() {
    //     return new WorkflowMethods(this.app, this.data);
    // }
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
        this.api = authData.creds.host + `/api/a/sm/${this.app._id}/service/${this.data._id}`;
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
        this.api = authData.creds.host + `/api/a/sm/${this.app._id}/service/${this.data._id}`;
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
        this.api = authData.creds.host + `/api/a/sm/${this.app._id}/service/${this.data._id}`;
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
    NewDocument(data) {
        return new types_1.DataStackDocument(data);
    }
    CountRecords(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchParams = new URLSearchParams();
                searchParams.append('countOnly', 'true');
                if (filter) {
                    searchParams.append('filter', JSON.stringify(filter));
                }
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
    UpdateRecord(id, data, options) {
        return __awaiter(this, void 0, void 0, function* () {
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
                let resp = yield got_1.default.put(url, {
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
    UpsertRecord(id, data, options) {
        return __awaiter(this, void 0, void 0, function* () {
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
                let resp = yield got_1.default.put(url, {
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
    CreateRecord(data, options) {
        return __awaiter(this, void 0, void 0, function* () {
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
                let resp = yield got_1.default.post(url, {
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
    BulkDeleteRecords(options) {
        return __awaiter(this, void 0, void 0, function* () {
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
                let resp = yield got_1.default.delete(url, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: {}
                });
                return new types_1.SuccessResponse(resp.body);
            }
            catch (err) {
                logError('[ERROR] [BulkDeleteRecords]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
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
    //         let resp = await got.put(url, {
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
    UploadFileFromPath(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const form = new form_data_1.default();
                form.append('file', fs_1.createReadStream(filePath));
                let resp = yield got_1.default.post(this.api + '/utils/file/upload', {
                    headers: {
                        Authorization: 'JWT ' + authData.token,
                    },
                    body: form,
                    responseType: 'json'
                });
                return new types_1.FileUploadResponse(resp.body);
            }
            catch (err) {
                logError('[ERROR] [UploadFileFromPath]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    UploadFileAsStream(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const form = new form_data_1.default();
                form.append('file', data);
                let resp = yield got_1.default.post(this.api + '/utils/file/upload', {
                    headers: {
                        Authorization: 'JWT ' + authData.token,
                    },
                    body: form,
                    responseType: 'json'
                });
                return new types_1.FileUploadResponse(resp.body);
            }
            catch (err) {
                logError('[ERROR] [UploadFileAsStream]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    DownloadFileAsStream(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.stream(this.api + '/utils/file/download/' + data.filename, {
                    isStream: true,
                    headers: {
                        Authorization: 'JWT ' + authData.token,
                    }
                });
                return resp;
            }
            catch (err) {
                logError('[ERROR] [UploadFileAsStream]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    AggregatePipeline(pipeline) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.post(this.api + '/utils/aggregate', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: pipeline
                });
                return resp.body.map((item) => {
                    return new types_1.DataStackDocument(item);
                });
            } catch (err) {
                logError('[ERROR] [AggregatePipeline]', err);
                throw new ErrorResponse(err.response);
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
class WorkflowMethods {
    constructor(app, data) {
        this.app = app;
        this.data = data;
        this.api = authData.creds.host + '/api/c/' + this.app._id + this.data.api + '/utils/workflow';
    }
    getPendingRecordIdsOfUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const searchParams = new URLSearchParams();
                searchParams.append('select', '_id');
                searchParams.append('count', '-1');
                searchParams.append('filter', JSON.stringify({ requestedBy: user, status: 'Pending' }));
                let resp = yield got_1.default.get(this.api + '/action?app=' + this.app._id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    searchParams: searchParams,
                    responseType: 'json',
                });
                return resp.body.map((e) => e._id);
            }
            catch (err) {
                logError('[ERROR] [getPendingRecordIdsOfUser]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    CreateRespondData() {
        return new types_1.WorkflowRespond();
    }
    ApproveRecords(ids, respondData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!respondData) {
                    respondData = new types_1.WorkflowRespond();
                }
                const payload = respondData.CreatePayload();
                payload.action = types_1.WorkflowActions.APPROVE;
                payload.ids = ids;
                let resp = yield got_1.default.put(this.api + '/action?app=' + this.app._id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: payload
                });
                return resp.body;
            }
            catch (err) {
                logError('[ERROR] [ApproveRecords]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    RejectRecords(ids, respondData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!respondData) {
                    respondData = new types_1.WorkflowRespond();
                }
                const payload = respondData.CreatePayload();
                payload.action = types_1.WorkflowActions.REJECT;
                payload.ids = ids;
                let resp = yield got_1.default.put(this.api + '/action?app=' + this.app._id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: payload
                });
                return resp.body;
            }
            catch (err) {
                logError('[ERROR] [RejectRecords]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    ReworkRecords(ids, respondData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!respondData) {
                    respondData = new types_1.WorkflowRespond();
                }
                const payload = respondData.CreatePayload();
                payload.action = types_1.WorkflowActions.REWORK;
                payload.ids = ids;
                let resp = yield got_1.default.put(this.api + '/action?app=' + this.app._id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: payload
                });
                return resp.body;
            }
            catch (err) {
                logError('[ERROR] [ReworkRecords]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    ApproveRecordsRequestedBy(user, respondData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!respondData) {
                    respondData = new types_1.WorkflowRespond();
                }
                const payload = respondData.CreatePayload();
                payload.action = types_1.WorkflowActions.APPROVE;
                payload.ids = yield this.getPendingRecordIdsOfUser(user);
                let resp = yield got_1.default.put(this.api + '/action?app=' + this.app._id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: payload
                });
                return resp.body;
            }
            catch (err) {
                logError('[ERROR] [ApproveRecordsRequestedBy]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    RejectRecordsRequestedBy(user, respondData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!respondData) {
                    respondData = new types_1.WorkflowRespond();
                }
                const payload = respondData.CreatePayload();
                payload.action = types_1.WorkflowActions.REJECT;
                payload.ids = yield this.getPendingRecordIdsOfUser(user);
                let resp = yield got_1.default.put(this.api + '/action?app=' + this.app._id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: payload
                });
                return resp.body;
            }
            catch (err) {
                logError('[ERROR] [RejectRecordsRequestedBy]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    ReworkRecordsRequestedBy(user, respondData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!respondData) {
                    respondData = new types_1.WorkflowRespond();
                }
                const payload = respondData.CreatePayload();
                payload.action = types_1.WorkflowActions.REWORK;
                payload.ids = yield this.getPendingRecordIdsOfUser(user);
                let resp = yield got_1.default.put(this.api + '/action?app=' + this.app._id, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: payload
                });
                return resp.body;
            }
            catch (err) {
                logError('[ERROR] [ReworkRecordsRequestedBy]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
}
exports.WorkflowMethods = WorkflowMethods;
class TransactionMethods {
    constructor(app, dataServiceMap) {
        this.app = app;
        this.dataServiceMap = dataServiceMap;
        this.api = authData.creds.host + '/api/common/txn?app=' + this.app._id;
        this.payload = [];
    }
    CreateOperation(dataService, data) {
        const temp = {};
        temp.operation = 'POST';
        temp.data = data;
        temp.dataService = {
            name: dataService,
            app: this.app._id
        };
        this.payload.push(temp);
        return this;
    }
    UpdateOperation(dataService, data, upsert) {
        const temp = {};
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
    DeleteOperation(dataService, data) {
        const temp = {};
        temp.operation = 'DELETE';
        temp.data = data;
        temp.dataService = {
            name: dataService,
            app: this.app._id
        };
        this.payload.push(temp);
        return this;
    }
    Execute() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.post(this.api, {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json',
                    json: this.payload
                });
                this.payload = [];
                return resp.body;
            }
            catch (err) {
                this.payload = [];
                logError('[ERROR] [Execute]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
}
exports.TransactionMethods = TransactionMethods;
exports.default = { authenticateByCredentials, authenticateByToken };
