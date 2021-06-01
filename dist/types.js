"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metadata = exports.DataStackDocument = exports.ErrorResponse = exports.DefinitionProperties = exports.Definition = exports.DataService = exports.ListOptions = exports.Credentials = exports.BasicDetails = exports.AccessControl = exports.Auth = exports.UserDetails = exports.Logo = exports.AppCenterStyle = exports.App = void 0;
class App {
    constructor(data) {
        this._id = data === null || data === void 0 ? void 0 : data._id;
        this.description = data === null || data === void 0 ? void 0 : data.description;
        this.appCenterStyle = data === null || data === void 0 ? void 0 : data.appCenterStyle;
        this.logo = data === null || data === void 0 ? void 0 : data.logo;
        this.users = data === null || data === void 0 ? void 0 : data.users;
        this.groups = data === null || data === void 0 ? void 0 : data.groups;
    }
}
exports.App = App;
class AppCenterStyle {
    constructor(data) {
        this.theme = data === null || data === void 0 ? void 0 : data.theme;
        this.bannerColor = data === null || data === void 0 ? void 0 : data.bannerColor;
        this.primaryColor = data === null || data === void 0 ? void 0 : data.primaryColor;
        this.textColor = data === null || data === void 0 ? void 0 : data.textColor;
    }
}
exports.AppCenterStyle = AppCenterStyle;
class Logo {
    constructor(data) {
        this.full = data === null || data === void 0 ? void 0 : data.full;
        this.thumbnail = data === null || data === void 0 ? void 0 : data.thumbnail;
    }
}
exports.Logo = Logo;
class UserDetails {
    constructor(data) {
        this._id = data === null || data === void 0 ? void 0 : data._id;
        this.basicDetails = data === null || data === void 0 ? void 0 : data.basicDetails;
        this.enableSessionRefresh = data === null || data === void 0 ? void 0 : data.enableSessionRefresh;
        this.username = data === null || data === void 0 ? void 0 : data.username;
        this.sessionTime = data === null || data === void 0 ? void 0 : data.sessionTime;
        this.accessControl = data === null || data === void 0 ? void 0 : data.accessControl;
        this.description = data === null || data === void 0 ? void 0 : data.description;
        this.apps = data === null || data === void 0 ? void 0 : data.apps;
        this.token = data === null || data === void 0 ? void 0 : data.token;
        this.rToken = data === null || data === void 0 ? void 0 : data.rToken;
        this.expiresIn = data === null || data === void 0 ? void 0 : data.expiresIn;
        this.serverTime = data === null || data === void 0 ? void 0 : data.serverTime;
        this.auth = data === null || data === void 0 ? void 0 : data.auth;
        this.isSuperAdmin = data === null || data === void 0 ? void 0 : data.isSuperAdmin;
        this.rbacBotTokenDuration = data === null || data === void 0 ? void 0 : data.rbacBotTokenDuration;
        this.rbacHbInterval = data === null || data === void 0 ? void 0 : data.rbacHbInterval;
        this.rbacUserCloseWindowToLogout = data === null || data === void 0 ? void 0 : data.rbacUserCloseWindowToLogout;
        this.rbacUserToSingleSession = data === null || data === void 0 ? void 0 : data.rbacUserToSingleSession;
        this.rbacUserTokenDuration = data === null || data === void 0 ? void 0 : data.rbacUserTokenDuration;
        this.rbacUserTokenRefresh = data === null || data === void 0 ? void 0 : data.rbacUserTokenRefresh;
        this.googleApiKey = data === null || data === void 0 ? void 0 : data.googleApiKey;
        this.uuid = data === null || data === void 0 ? void 0 : data.uuid;
        this.lastLogin = data === null || data === void 0 ? void 0 : data.lastLogin;
        this.bot = data === null || data === void 0 ? void 0 : data.bot;
        this.defaultTimezone = data === null || data === void 0 ? void 0 : data.defaultTimezone;
        this.b2BEnable = data === null || data === void 0 ? void 0 : data.b2BEnable;
    }
}
exports.UserDetails = UserDetails;
class Auth {
    constructor(data) {
        this.isLdap = data === null || data === void 0 ? void 0 : data.isLdap;
        this.dn = data === null || data === void 0 ? void 0 : data.dn;
        this.authType = data === null || data === void 0 ? void 0 : data.authType;
    }
}
exports.Auth = Auth;
class AccessControl {
    constructor(data) {
        this.apps = data === null || data === void 0 ? void 0 : data.apps;
        this.accessLevel = data === null || data === void 0 ? void 0 : data.accessLevel;
    }
}
exports.AccessControl = AccessControl;
class BasicDetails {
    constructor(data) {
        this.name = data === null || data === void 0 ? void 0 : data.name;
        this.email = data === null || data === void 0 ? void 0 : data.email;
        this.phone = data === null || data === void 0 ? void 0 : data.phone;
    }
}
exports.BasicDetails = BasicDetails;
class Credentials {
    constructor(data) {
        this.host = (data === null || data === void 0 ? void 0 : data.host) || process.env.DATA_STACK_HOST;
        this.username = (data === null || data === void 0 ? void 0 : data.username) || process.env.DATA_STACK_USERNAME;
        this.password = (data === null || data === void 0 ? void 0 : data.password) || process.env.DATA_STACK_PASSWORD;
        this.token = (data === null || data === void 0 ? void 0 : data.token) || process.env.DATA_STACK_TOKEN;
    }
}
exports.Credentials = Credentials;
class ListOptions {
    constructor(data) {
        this.select = data.select;
        this.sort = data.sort;
        this.page = data.page;
        this.count = data.count;
        this.filter = data.filter;
    }
}
exports.ListOptions = ListOptions;
class DataService {
    constructor(data) {
        this._id = data === null || data === void 0 ? void 0 : data._id;
        this.name = data === null || data === void 0 ? void 0 : data.name;
        this.description = data === null || data === void 0 ? void 0 : data.description;
        this.api = data === null || data === void 0 ? void 0 : data.api;
        this.definition = data === null || data === void 0 ? void 0 : data.definition;
    }
}
exports.DataService = DataService;
class Definition {
}
exports.Definition = Definition;
class DefinitionProperties {
    constructor(data) {
        this.required = (data === null || data === void 0 ? void 0 : data.required) || false;
        this.unique = (data === null || data === void 0 ? void 0 : data.unique) || false;
        this.createOnly = (data === null || data === void 0 ? void 0 : data.createOnly) || false;
        this.maxLength = data === null || data === void 0 ? void 0 : data.maxLength;
        this.minLength = data === null || data === void 0 ? void 0 : data.minLength;
        this.max = data === null || data === void 0 ? void 0 : data.max;
        this.min = data === null || data === void 0 ? void 0 : data.min;
        this.pattern = data === null || data === void 0 ? void 0 : data.pattern;
        this.default = data === null || data === void 0 ? void 0 : data.default;
        this.relatedTo = data === null || data === void 0 ? void 0 : data.relatedTo;
        this.schema = data === null || data === void 0 ? void 0 : data.schema;
    }
}
exports.DefinitionProperties = DefinitionProperties;
class ErrorResponse {
    constructor(data) {
        this.statusCode = data.statusCode;
        this.body = data.body;
        this.message = data.statusMessage;
    }
}
exports.ErrorResponse = ErrorResponse;
class DataStackDocument {
    constructor(data) {
        Object.assign(this, data);
        this._id = data._id;
        this._metadata = new Metadata(data._metadata);
    }
}
exports.DataStackDocument = DataStackDocument;
class Metadata {
    constructor(data) {
        this.deleted = data.deleted || false;
        this.lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : undefined;
        this.lastUpdatedBy = data.lastUpdatedBy || '';
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.version = data.version;
    }
}
exports.Metadata = Metadata;
