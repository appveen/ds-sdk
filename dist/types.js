"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowRespond = exports.WorkflowActions = exports.SchemaFieldProperties = exports.SchemaFieldTypes = exports.SchemaField = exports.WebHook = exports.Metadata = exports.DataStackDocument = exports.SuccessResponse = exports.ErrorResponse = exports.RoleMethods = exports.RoleBlock = exports.DataService = exports.ListOptions = exports.Credentials = exports.BasicDetails = exports.AccessControl = exports.Auth = exports.UserDetails = exports.Logo = exports.AppCenterStyle = exports.App = void 0;
const lodash_1 = require("lodash");
const fs_1 = require("fs");
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
        this.select = data === null || data === void 0 ? void 0 : data.select;
        this.sort = data === null || data === void 0 ? void 0 : data.sort;
        this.page = data === null || data === void 0 ? void 0 : data.page;
        this.count = (data === null || data === void 0 ? void 0 : data.count) || 30;
        this.filter = (data === null || data === void 0 ? void 0 : data.filter) || {};
        this.expand = (data === null || data === void 0 ? void 0 : data.expand) || false;
    }
}
exports.ListOptions = ListOptions;
class DataService {
    constructor(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _q, _r, _s, _u, _v, _w, _x;
        this._id = data === null || data === void 0 ? void 0 : data._id;
        this.name = data === null || data === void 0 ? void 0 : data.name;
        this.description = data === null || data === void 0 ? void 0 : data.description;
        this.api = data === null || data === void 0 ? void 0 : data.api;
        this.definition = [];
        this.preHooks = [];
        this.webHooks = [];
        this.workflowHooks = (data === null || data === void 0 ? void 0 : data.workflowHooks) || { postHooks: { approve: [], discard: [], reject: [], rework: [], submit: [] } };
        if (data === null || data === void 0 ? void 0 : data.definition) {
            this.definition = data === null || data === void 0 ? void 0 : data.definition.map(e => new SchemaField(e));
        }
        if (data === null || data === void 0 ? void 0 : data.preHooks) {
            this.preHooks = data === null || data === void 0 ? void 0 : data.preHooks.map(e => new WebHook(e));
        }
        if (data === null || data === void 0 ? void 0 : data.webHooks) {
            this.webHooks = data === null || data === void 0 ? void 0 : data.webHooks.map(e => new WebHook(e));
        }
        if ((_b = (_a = data === null || data === void 0 ? void 0 : data.workflowHooks) === null || _a === void 0 ? void 0 : _a.postHooks) === null || _b === void 0 ? void 0 : _b.approve) {
            this.workflowHooks.postHooks.approve = (_d = (_c = data === null || data === void 0 ? void 0 : data.workflowHooks) === null || _c === void 0 ? void 0 : _c.postHooks) === null || _d === void 0 ? void 0 : _d.approve.map(e => new WebHook(e));
        }
        if ((_f = (_e = data === null || data === void 0 ? void 0 : data.workflowHooks) === null || _e === void 0 ? void 0 : _e.postHooks) === null || _f === void 0 ? void 0 : _f.discard) {
            this.workflowHooks.postHooks.discard = (_h = (_g = data === null || data === void 0 ? void 0 : data.workflowHooks) === null || _g === void 0 ? void 0 : _g.postHooks) === null || _h === void 0 ? void 0 : _h.discard.map(e => new WebHook(e));
        }
        if ((_k = (_j = data === null || data === void 0 ? void 0 : data.workflowHooks) === null || _j === void 0 ? void 0 : _j.postHooks) === null || _k === void 0 ? void 0 : _k.reject) {
            this.workflowHooks.postHooks.reject = (_m = (_l = data === null || data === void 0 ? void 0 : data.workflowHooks) === null || _l === void 0 ? void 0 : _l.postHooks) === null || _m === void 0 ? void 0 : _m.reject.map(e => new WebHook(e));
        }
        if ((_q = (_o = data === null || data === void 0 ? void 0 : data.workflowHooks) === null || _o === void 0 ? void 0 : _o.postHooks) === null || _q === void 0 ? void 0 : _q.rework) {
            this.workflowHooks.postHooks.rework = (_s = (_r = data === null || data === void 0 ? void 0 : data.workflowHooks) === null || _r === void 0 ? void 0 : _r.postHooks) === null || _s === void 0 ? void 0 : _s.rework.map(e => new WebHook(e));
        }
        if ((_v = (_u = data === null || data === void 0 ? void 0 : data.workflowHooks) === null || _u === void 0 ? void 0 : _u.postHooks) === null || _v === void 0 ? void 0 : _v.submit) {
            this.workflowHooks.postHooks.submit = (_x = (_w = data === null || data === void 0 ? void 0 : data.workflowHooks) === null || _w === void 0 ? void 0 : _w.postHooks) === null || _x === void 0 ? void 0 : _x.submit.map(e => new WebHook(e));
        }
        this.role = (data === null || data === void 0 ? void 0 : data.role) || { fields: {}, roles: [new RoleBlock()] };
        this.draftVersion = data === null || data === void 0 ? void 0 : data.draftVersion;
        this.version = (data === null || data === void 0 ? void 0 : data.version) || 1;
    }
    HasDraft() {
        try {
            if (typeof this.draftVersion === 'number') {
                return true;
            }
            return false;
        }
        catch (err) {
            console.error('[ERROR] [Start]', err);
            throw new ErrorResponse(err.response);
        }
    }
}
exports.DataService = DataService;
class RoleBlock {
    constructor(data) {
        this.id = (data === null || data === void 0 ? void 0 : data.id) || 'P' + Math.ceil(Math.random() * 10000000000);
        this.name = data === null || data === void 0 ? void 0 : data.name;
        this.description = data === null || data === void 0 ? void 0 : data.description;
        this.manageRole = (data === null || data === void 0 ? void 0 : data.manageRole) || false;
        this.viewRole = (data === null || data === void 0 ? void 0 : data.viewRole) || false;
        this.skipReviewRole = (data === null || data === void 0 ? void 0 : data.skipReviewRole) || false;
        this.operations = (data === null || data === void 0 ? void 0 : data.operations) || [{ method: RoleMethods.GET }];
    }
    setName(name) {
        this.name = name;
    }
    setDescription(description) {
        this.description = description;
    }
    enableCreate() {
        this.operations.push({ method: RoleMethods.POST });
        return this;
    }
    disableCreate() {
        const index = this.operations.findIndex(e => e.method === RoleMethods.POST);
        this.operations.splice(index, 1);
        return this;
    }
    enableEdit() {
        this.operations.push({ method: RoleMethods.PUT });
        return this;
    }
    disableEdit() {
        const index = this.operations.findIndex(e => e.method === RoleMethods.PUT);
        this.operations.splice(index, 1);
        return this;
    }
    enableDelete() {
        this.operations.push({ method: RoleMethods.DELETE });
        return this;
    }
    disableDelete() {
        const index = this.operations.findIndex(e => e.method === RoleMethods.DELETE);
        this.operations.splice(index, 1);
        return this;
    }
    enableReview() {
        this.operations.push({ method: RoleMethods.REVIEW });
        return this;
    }
    disableReview() {
        const index = this.operations.findIndex(e => e.method === RoleMethods.REVIEW);
        this.operations.splice(index, 1);
        return this;
    }
    enableSkipReview() {
        this.operations.push({ method: RoleMethods.SKIP_REVIEW });
        return this;
    }
    disableSkipReview() {
        const index = this.operations.findIndex(e => e.method === RoleMethods.SKIP_REVIEW);
        this.operations.splice(index, 1);
        return this;
    }
}
exports.RoleBlock = RoleBlock;
var RoleMethods;
(function (RoleMethods) {
    RoleMethods["GET"] = "GET";
    RoleMethods["PUT"] = "PUT";
    RoleMethods["POST"] = "POST";
    RoleMethods["DELETE"] = "DELETE";
    RoleMethods["REVIEW"] = "REVIEW";
    RoleMethods["SKIP_REVIEW"] = "SKIP_REVIEW";
})(RoleMethods = exports.RoleMethods || (exports.RoleMethods = {}));
class ErrorResponse {
    constructor(data) {
        if (typeof data === 'string') {
            this.statusCode = 500;
            this.body = { message: data };
            this.message = 'Internal Error';
        }
        else {
            this.statusCode = data === null || data === void 0 ? void 0 : data.statusCode;
            this.body = data === null || data === void 0 ? void 0 : data.body;
            this.message = data === null || data === void 0 ? void 0 : data.statusMessage;
        }
    }
}
exports.ErrorResponse = ErrorResponse;
class SuccessResponse {
    constructor(data) {
        this.message = data === null || data === void 0 ? void 0 : data.message;
    }
}
exports.SuccessResponse = SuccessResponse;
class DataStackDocument {
    constructor(data) {
        Object.assign(this, data);
        this._id = data === null || data === void 0 ? void 0 : data._id;
        this._metadata = new Metadata(data === null || data === void 0 ? void 0 : data._metadata);
    }
}
exports.DataStackDocument = DataStackDocument;
class Metadata {
    constructor(data) {
        this.deleted = (data === null || data === void 0 ? void 0 : data.deleted) || false;
        this.lastUpdated = (data === null || data === void 0 ? void 0 : data.lastUpdated) ? new Date(data === null || data === void 0 ? void 0 : data.lastUpdated) : undefined;
        this.lastUpdatedBy = (data === null || data === void 0 ? void 0 : data.lastUpdatedBy) || '';
        this.createdAt = (data === null || data === void 0 ? void 0 : data.createdAt) ? new Date(data === null || data === void 0 ? void 0 : data.createdAt) : undefined;
        this.version = data === null || data === void 0 ? void 0 : data.version;
    }
}
exports.Metadata = Metadata;
class WebHook {
    constructor(data) {
        this.name = data.name;
        this.url = data.url;
        this.failMessage = data.failMessage;
    }
}
exports.WebHook = WebHook;
class SchemaField {
    constructor(data) {
        this.key = data === null || data === void 0 ? void 0 : data.key;
        this.type = (data === null || data === void 0 ? void 0 : data.type) || SchemaFieldTypes.STRING;
        this.properties = new SchemaFieldProperties(data === null || data === void 0 ? void 0 : data.properties);
        this.definition = [];
        if (data === null || data === void 0 ? void 0 : data.definition) {
            this.definition = data === null || data === void 0 ? void 0 : data.definition.map(e => new SchemaField(e));
        }
    }
    newField(data) {
        return new SchemaField(data);
    }
    getName() {
        return this.properties.getName();
    }
    setName(name) {
        this.properties.setName(name);
        this.key = lodash_1.camelCase(name);
    }
    getKey() {
        return this.key;
    }
    setKey(key) {
        this.key = key;
        this.setName(lodash_1.startCase(key));
    }
    getType() {
        return this.type;
    }
    setType(type) {
        this.type = type;
        if (this.type === SchemaFieldTypes.ARRAY) {
            const childField = new SchemaField();
            childField.setKey('_self');
            return childField;
        }
        else {
            return this;
        }
    }
    addChildField(data) {
        this.type = SchemaFieldTypes.OBJECT;
        this.definition.push(data);
        return this;
    }
    removeChildField(name) {
        const index = this.definition.findIndex(e => e.getName() === name);
        this.definition.splice(index, 1);
        return this;
    }
    getProperties() {
        return this.properties;
    }
}
exports.SchemaField = SchemaField;
var SchemaFieldTypes;
(function (SchemaFieldTypes) {
    SchemaFieldTypes["STRING"] = "String";
    SchemaFieldTypes["NUMBER"] = "Number";
    SchemaFieldTypes["BOOLEAN"] = "Boolean";
    SchemaFieldTypes["DATA"] = "Data";
    SchemaFieldTypes["OBJECT"] = "Object";
    SchemaFieldTypes["ARRAY"] = "Array";
    SchemaFieldTypes["RELATION"] = "Relation";
    SchemaFieldTypes["SCHEMA"] = "Global";
    SchemaFieldTypes["LOCATION"] = "Geojson";
})(SchemaFieldTypes = exports.SchemaFieldTypes || (exports.SchemaFieldTypes = {}));
class SchemaFieldProperties {
    constructor(data) {
        this.name = data === null || data === void 0 ? void 0 : data.name;
        this.required = (data === null || data === void 0 ? void 0 : data.required) || false;
        this.unique = (data === null || data === void 0 ? void 0 : data.unique) || false;
        this.createOnly = (data === null || data === void 0 ? void 0 : data.createOnly) || false;
        this.email = (data === null || data === void 0 ? void 0 : data.email) || false;
        this.password = (data === null || data === void 0 ? void 0 : data.password) || false;
        this.enum = (data === null || data === void 0 ? void 0 : data.enum) || [];
        this.tokens = (data === null || data === void 0 ? void 0 : data.tokens) || [];
        this.maxLength = data === null || data === void 0 ? void 0 : data.maxLength;
        this.minLength = data === null || data === void 0 ? void 0 : data.minLength;
        this.max = data === null || data === void 0 ? void 0 : data.max;
        this.min = data === null || data === void 0 ? void 0 : data.min;
        this.pattern = data === null || data === void 0 ? void 0 : data.pattern;
        this.default = data === null || data === void 0 ? void 0 : data.default;
        this.relatedTo = data === null || data === void 0 ? void 0 : data.relatedTo;
        this.schema = data === null || data === void 0 ? void 0 : data.schema;
        this.dateType = data === null || data === void 0 ? void 0 : data.dateType;
    }
    getName() {
        return this.name;
    }
    setName(name) {
        this.name = name;
    }
    isRequired() {
        return this.required;
    }
    setRequired(required) {
        this.required = required;
    }
    isUnique() {
        return this.unique;
    }
    setUnique(unique) {
        this.unique = unique;
    }
    isCreateOnly() {
        return this.createOnly;
    }
    setCreateOnly(createOnly) {
        this.createOnly = createOnly;
    }
    isEmail() {
        return this.email;
    }
    setEmail(email) {
        this.email = email;
    }
    isPassword() {
        return this.password;
    }
    setPassword(password) {
        this.password = password;
    }
    getMaxLength() {
        return this.maxLength;
    }
    setMaxLength(maxLength) {
        this.maxLength = maxLength;
    }
    getMinLength() {
        return this.minLength;
    }
    setMinLength(minLength) {
        this.minLength = minLength;
    }
    getMax() {
        return this.max;
    }
    setMax(max) {
        this.max = max;
    }
    getMin() {
        return this.min;
    }
    setMin(min) {
        this.min = min;
    }
    getPattern() {
        return this.pattern;
    }
    setPattern(pattern) {
        this.pattern = pattern;
    }
    getDefault() {
        return this.default;
    }
    setDefault(value) {
        this.default = value;
    }
    getRelatedTo() {
        return this.relatedTo;
    }
    setRelatedTo(relatedTo) {
        this.relatedTo = relatedTo;
    }
    getSchema() {
        return this.schema;
    }
    setSchema(schema) {
        this.schema = schema;
    }
}
exports.SchemaFieldProperties = SchemaFieldProperties;
var WorkflowActions;
(function (WorkflowActions) {
    WorkflowActions["DISCARD"] = "Discard";
    WorkflowActions["SUBMIT"] = "Submit";
    WorkflowActions["REWORK"] = "Rework";
    WorkflowActions["APPROVE"] = "Approve";
    WorkflowActions["REJECT"] = "Reject";
})(WorkflowActions = exports.WorkflowActions || (exports.WorkflowActions = {}));
class WorkflowRespond {
    constructor(data) {
        this.remarks = data === null || data === void 0 ? void 0 : data.remarks;
        this.attachments = (data === null || data === void 0 ? void 0 : data.attachments) || [];
    }
    // public AddFileFromBuffer(data: any): WorkflowRespond {
    //     return this;
    // }
    AddFileFromPath(filePath) {
        fs_1.readFileSync(filePath);
        return this;
    }
    RemoveFile(name) {
        const index = this.attachments.findIndex(e => e.name === name);
        if (index > -1) {
            this.attachments.splice(index, 1);
        }
        return this;
    }
    SetRemarks(text) {
        this.remarks = text;
        return this;
    }
    CreatePayload() {
        return {
            remarks: this.remarks,
            attachments: this.attachments
        };
    }
}
exports.WorkflowRespond = WorkflowRespond;
