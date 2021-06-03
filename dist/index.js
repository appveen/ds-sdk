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
const types_1 = require("./types");
var authData;
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
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = { username: this.creds.username, password: this.creds.password };
                const resp = yield got_1.default.post(this.api + '/login', { json: payload, responseType: 'json' });
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
                console.log('[HB Triggred]', this.token, this.uuid);
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
                    else {
                        console.log(err.body);
                    }
                    console.error('[ERROR] [createHBRoutine]', err);
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
            console.log('[Refresh Triggred]', this.token, this.rToken);
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
                else {
                    console.log(err.response.body);
                }
                console.error('[ERROR] [createTokenRefreshRoutine]', err);
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
    }
}
class DataStack {
    constructor() {
        this.api = authData.creds.host + '/api/a/rbac/app';
    }
    ListApps() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.get(this.api, {
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
                console.error('[ERROR] [ListApps]', err);
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
                console.error('[ERROR] [App]', err);
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
    }
    ListDataServices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filter = { app: this.app._id };
                const searchParams = new URLSearchParams();
                searchParams.append('filter', JSON.stringify(filter));
                // searchParams.append('draft', 'true');
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
                console.error('[ERROR] [ListDataServices]', err);
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
                // searchParams.append('draft', 'true');
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
                console.error('[ERROR] [DataService]', err);
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
        this.api = authData.creds.host + `/api/a/sm/${this.data._id}`;
        this.smApi = authData.creds.host + `/api/a/sm/service`;
    }
    Start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield got_1.default.put(this.api + '/start', {
                    headers: {
                        Authorization: 'JWT ' + authData.token
                    },
                    responseType: 'json'
                });
                return new types_1.ErrorResponse({ statusCode: 200, body: resp.body });
            }
            catch (err) {
                console.error('[ERROR] [Start]', err);
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
                    responseType: 'json'
                });
                return new types_1.ErrorResponse({ statusCode: 200, body: resp.body });
            }
            catch (err) {
                console.error('[ERROR] [Stop]', err);
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
                    responseType: 'json'
                });
                return new types_1.ErrorResponse({ statusCode: 200, body: resp.body });
            }
            catch (err) {
                console.error('[ERROR] [ScaleUp]', err);
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
                    responseType: 'json'
                });
                return new types_1.ErrorResponse({ statusCode: 200, body: resp.body });
            }
            catch (err) {
                console.error('[ERROR] [ScaleDown]', err);
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
                    responseType: 'json'
                });
                return new types_1.ErrorResponse({ statusCode: 200, body: resp.body });
            }
            catch (err) {
                console.error('[ERROR] [Repair]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    getIntegrations() {
        try {
            return new DSDataServiceIntegration(this.app, this.data);
        }
        catch (err) {
            console.error('[ERROR] [getIntegrations]', err);
            throw new types_1.ErrorResponse(err.response);
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
                console.error('[ERROR] [setIntegrations]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    getRoles() {
        try {
            return new DSDataServiceRole(this.app, this.data);
        }
        catch (err) {
            console.error('[ERROR] [getRoles]', err);
            throw new types_1.ErrorResponse(err.response);
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
                console.error('[ERROR] [setRoles]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    getSchema() {
        try {
            return new DSDataServiceSchema(this.app, this.data);
        }
        catch (err) {
            console.error('[ERROR] [getSchema]', err);
            throw new types_1.ErrorResponse(err.response);
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
                console.error('[ERROR] [setSchema]', err);
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
            console.error('[ERROR] [listRoles]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    getRole(name) {
        try {
            return this.data.role.roles.find(e => e.name === name);
        }
        catch (err) {
            console.error('[ERROR] [getRole]', err);
            throw new types_1.ErrorResponse(err.response);
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
            console.error('[ERROR] [getRole]', err);
            throw new types_1.ErrorResponse(err.response);
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
            console.error('[ERROR] [addRole]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    removeRole(name) {
        try {
            const index = this.data.role.roles.findIndex(e => e.name === name);
            this.data.role.roles.splice(index, 1);
            return this;
        }
        catch (err) {
            console.error('[ERROR] [removeRole]', err);
            throw new types_1.ErrorResponse(err.response);
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
            console.error('[ERROR] [listPreHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    getPreHook(name) {
        try {
            return this.data.preHooks.find(e => e.name === name);
        }
        catch (err) {
            console.error('[ERROR] [getPreHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    addPreHook(data) {
        try {
            this.data.preHooks.push(data);
            return this;
        }
        catch (err) {
            console.error('[ERROR] [addPreHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    removePreHook(name) {
        try {
            const index = this.data.preHooks.findIndex(e => e.name === name);
            this.data.preHooks.splice(index, 1);
            return this;
        }
        catch (err) {
            console.error('[ERROR] [removePreHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    listPostHook() {
        try {
            return this.data.webHooks;
        }
        catch (err) {
            console.error('[ERROR] [listPostHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    getPostHook(name) {
        try {
            return this.data.webHooks.find(e => e.name === name);
        }
        catch (err) {
            console.error('[ERROR] [getPostHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    addPostHook(data) {
        try {
            this.data.webHooks.push(data);
            return this;
        }
        catch (err) {
            console.error('[ERROR] [addPostHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    removePostHook(name) {
        try {
            const index = this.data.webHooks.findIndex(e => e.name === name);
            this.data.webHooks.splice(index, 1);
            return this;
        }
        catch (err) {
            console.error('[ERROR] [removePostHook]', err);
            throw new types_1.ErrorResponse(err.response);
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
    getJSONSchema() {
        try {
            return this.data.preHooks;
        }
        catch (err) {
            console.error('[ERROR] [listPreHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    setJSONSchema(schema) {
        try {
            return this.data.preHooks;
        }
        catch (err) {
            console.error('[ERROR] [listPreHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    newField(data) {
        try {
            return new types_1.SchemaField(data);
        }
        catch (err) {
            console.error('[ERROR] [getPreHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    getField(name) {
        try {
            return this.data.definition.find(e => e.getName() === name);
        }
        catch (err) {
            console.error('[ERROR] [getPreHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    addField(data) {
        try {
            this.data.definition.push(data);
            return this;
        }
        catch (err) {
            console.error('[ERROR] [addPreHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    patchField(data) {
        try {
            this.data.definition.push(data);
            return this;
        }
        catch (err) {
            console.error('[ERROR] [addPreHook]', err);
            throw new types_1.ErrorResponse(err.response);
        }
    }
    removeField(name) {
        try {
            const index = this.data.preHooks.findIndex(e => e.name === name);
            this.data.preHooks.splice(index, 1);
            return this;
        }
        catch (err) {
            console.error('[ERROR] [removePreHook]', err);
            throw new types_1.ErrorResponse(err.response);
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
                console.error('[ERROR] [Count]', err);
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
                console.error('[ERROR] [List]', err);
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
                console.error('[ERROR] [Get]', err);
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
                console.error('[ERROR] [Put]', err);
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
                console.error('[ERROR] [Post]', err);
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
                    responseType: 'json'
                });
                return new types_1.ErrorResponse({ statusCode: 200, body: resp.body });
            }
            catch (err) {
                console.error('[ERROR] [Delete]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
    DoMath() {
        try {
            return new MathAPI();
        }
        catch (err) {
            console.error('[ERROR] [Delete]', err);
            throw new types_1.ErrorResponse(err.response);
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
                return new types_1.ErrorResponse({ statusCode: 200, body: resp.body });
            }
            catch (err) {
                console.error('[ERROR] [Delete]', err);
                throw new types_1.ErrorResponse(err.response);
            }
        });
    }
}
exports.DataMethods = DataMethods;
class MathAPI {
    constructor() {
        this.operations = { $inc: {}, $mul: {} };
    }
    SelectField(name) {
        this.selectedField = name;
        return this;
    }
    Increment(num) {
        if (!this.selectedField) {
            throw new Error('Please select the field first while using Math API');
        }
        this.operations.$inc[this.selectedField] = num;
        return this;
    }
    Multiply(num) {
        if (!this.selectedField) {
            throw new Error('Please select the field first while using Math API');
        }
        this.operations.$mul[this.selectedField] = num;
        return this;
    }
    CreatePayload() {
        return this.operations;
    }
}
exports.MathAPI = MathAPI;
exports.default = { authenticateByCredentials, authenticateByToken };
