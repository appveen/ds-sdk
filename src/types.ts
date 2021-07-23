import { camelCase, startCase } from 'lodash';
import { Logger } from 'log4js';

export class App {
    _id: string | undefined;
    description: string | undefined;
    appCenterStyle: AppCenterStyle | undefined;
    logo: Logo | undefined;
    users: Array<string> | undefined;
    groups: Array<string> | undefined;
    constructor(data?: App) {
        this._id = data?._id;
        this.description = data?.description;
        this.appCenterStyle = data?.appCenterStyle;
        this.logo = data?.logo;
        this.users = data?.users;
        this.groups = data?.groups;
    }
}

export class AppCenterStyle {
    theme: string | undefined;
    bannerColor: string | undefined;
    primaryColor: string | undefined;
    textColor: string | undefined;
    constructor(data?: AppCenterStyle) {
        this.theme = data?.theme;
        this.bannerColor = data?.bannerColor;
        this.primaryColor = data?.primaryColor;
        this.textColor = data?.textColor;
    }
}

export class Logo {
    full: string | undefined;
    thumbnail: string | undefined;
    constructor(data?: Logo) {
        this.full = data?.full;
        this.thumbnail = data?.thumbnail;
    }
}


export class UserDetails {
    _id: string | undefined;
    basicDetails: BasicDetails | undefined;
    enableSessionRefresh: boolean | undefined;
    username: string | undefined;
    sessionTime: number | undefined;
    accessControl: AccessControl | undefined;
    description: string | undefined;
    apps: App[] | undefined;
    token: string | undefined;
    rToken: string | undefined;
    expiresIn: number | undefined;
    serverTime: number | undefined;
    auth: Auth | undefined;
    isSuperAdmin: boolean | undefined;
    rbacBotTokenDuration: number | undefined;
    rbacHbInterval: number | undefined;
    rbacUserCloseWindowToLogout: boolean | undefined;
    rbacUserToSingleSession: boolean | undefined;
    rbacUserTokenDuration: number | undefined;
    rbacUserTokenRefresh: boolean | undefined;
    googleApiKey: string | undefined;
    uuid: string | undefined;
    lastLogin: any | undefined;
    bot: boolean | undefined;
    defaultTimezone: string | undefined;
    b2BEnable: boolean | undefined;

    constructor(data?: UserDetails) {
        this._id = data?._id;
        this.basicDetails = data?.basicDetails;
        this.enableSessionRefresh = data?.enableSessionRefresh;
        this.username = data?.username;
        this.sessionTime = data?.sessionTime;
        this.accessControl = data?.accessControl;
        this.description = data?.description;
        this.apps = data?.apps;
        this.token = data?.token;
        this.rToken = data?.rToken;
        this.expiresIn = data?.expiresIn;
        this.serverTime = data?.serverTime;
        this.auth = data?.auth;
        this.isSuperAdmin = data?.isSuperAdmin;
        this.rbacBotTokenDuration = data?.rbacBotTokenDuration;
        this.rbacHbInterval = data?.rbacHbInterval;
        this.rbacUserCloseWindowToLogout = data?.rbacUserCloseWindowToLogout;
        this.rbacUserToSingleSession = data?.rbacUserToSingleSession;
        this.rbacUserTokenDuration = data?.rbacUserTokenDuration;
        this.rbacUserTokenRefresh = data?.rbacUserTokenRefresh;
        this.googleApiKey = data?.googleApiKey;
        this.uuid = data?.uuid;
        this.lastLogin = data?.lastLogin;
        this.bot = data?.bot;
        this.defaultTimezone = data?.defaultTimezone;
        this.b2BEnable = data?.b2BEnable;
    }
}

export class Auth {
    isLdap: boolean | undefined;
    dn: string | undefined;
    authType: string | undefined;
    constructor(data?: Auth) {
        this.isLdap = data?.isLdap;
        this.dn = data?.dn;
        this.authType = data?.authType;
    }
}
export class AccessControl {
    apps: App[] | undefined;
    accessLevel: string | undefined;
    constructor(data?: AccessControl) {
        this.apps = data?.apps;
        this.accessLevel = data?.accessLevel;
    }
}

export class BasicDetails {
    name: string | undefined;
    email: string | undefined;
    phone: string | undefined;
    constructor(data?: BasicDetails) {
        this.name = data?.name;
        this.email = data?.email;
        this.phone = data?.phone;
    }
}


export class Credentials {
    host?: string | undefined;
    /**
     * @description Username or Client ID
     */
    username: string | undefined;
    /**
     * @description Password or API Key
     */
    password: string | undefined;
    /**
     * @description Available Authentication Token
     */
    token?: string | undefined;
    /**
     * @description Enable trace logging
     */
    trace?: boolean;
    /**
     * @description Provide a custom logger.
     */
    logger?: Logger;
    constructor(data?: Credentials) {
        this.host = data?.host || process.env.DATA_STACK_HOST;
        this.username = data?.username || process.env.DATA_STACK_USERNAME;
        this.password = data?.password || process.env.DATA_STACK_PASSWORD;
        this.token = data?.token || process.env.DATA_STACK_TOKEN;
    }
}

export class ListOptions {
    select: string | undefined;
    sort: string | undefined;
    page: number | undefined;
    count: number | undefined;
    filter: any | undefined;
    expand: boolean;
    constructor(data?: ListOptions) {
        this.select = data?.select;
        this.sort = data?.sort;
        this.page = data?.page;
        this.count = data?.count || 30;
        this.filter = data?.filter || {};
        this.expand = data?.expand || false;
    }
}

export class DataService {
    _id: string | undefined;
    name: string | undefined;
    description: string | undefined;
    api: string | undefined;
    definition: Array<SchemaField>;
    status: string | undefined;
    preHooks: Array<WebHook>;
    webHooks: Array<WebHook>;
    workflowHooks: {
        postHooks: {
            approve: Array<WebHook>;
            discard: Array<WebHook>;
            reject: Array<WebHook>;
            rework: Array<WebHook>;
            submit: Array<WebHook>;
        }
    };
    role: {
        fields: {
            [key: string]: {
                _t: string,
                _p: {
                    [key: string]: string
                }
            }
        },
        roles: Array<RoleBlock>
    }
    draftVersion?: number | undefined;
    version?: number;
    constructor(data?: DataService) {
        this._id = data?._id;
        this.name = data?.name;
        this.description = data?.description;
        this.api = data?.api;
        this.definition = [];
        this.preHooks = [];
        this.webHooks = [];
        this.workflowHooks = data?.workflowHooks || { postHooks: { approve: [], discard: [], reject: [], rework: [], submit: [] } };
        if (data?.definition) {
            this.definition = data?.definition.map(e => new SchemaField(e));
        }
        if (data?.preHooks) {
            this.preHooks = data?.preHooks.map(e => new WebHook(e));
        }
        if (data?.webHooks) {
            this.webHooks = data?.webHooks.map(e => new WebHook(e));
        }
        if (data?.workflowHooks?.postHooks?.approve) {
            this.workflowHooks.postHooks.approve = data?.workflowHooks?.postHooks?.approve.map(e => new WebHook(e));
        }
        if (data?.workflowHooks?.postHooks?.discard) {
            this.workflowHooks.postHooks.discard = data?.workflowHooks?.postHooks?.discard.map(e => new WebHook(e));
        }
        if (data?.workflowHooks?.postHooks?.reject) {
            this.workflowHooks.postHooks.reject = data?.workflowHooks?.postHooks?.reject.map(e => new WebHook(e));
        }
        if (data?.workflowHooks?.postHooks?.rework) {
            this.workflowHooks.postHooks.rework = data?.workflowHooks?.postHooks?.rework.map(e => new WebHook(e));
        }
        if (data?.workflowHooks?.postHooks?.submit) {
            this.workflowHooks.postHooks.submit = data?.workflowHooks?.postHooks?.submit.map(e => new WebHook(e));
        }
        this.role = data?.role || { fields: {}, roles: [new RoleBlock()] };
        this.draftVersion = data?.draftVersion;
        this.version = data?.version || 1;
    }

    public HasDraft(): boolean {
        try {
            if (typeof this.draftVersion === 'number') {
                return true;
            }
            return false;
        } catch (err: any) {
            console.error('[ERROR] [Start]', err);
            throw new ErrorResponse(err.response);
        }
    }
}

export class RoleBlock {
    id: string;
    name: string | undefined;
    description: string | undefined;
    manageRole: boolean;
    viewRole: boolean;
    skipReviewRole: boolean;
    operations: Array<{ method: RoleMethods }>

    constructor(data?: RoleBlock) {
        this.id = data?.id || 'P' + Math.ceil(Math.random() * 10000000000);
        this.name = data?.name;
        this.description = data?.description;
        this.manageRole = data?.manageRole || false;
        this.viewRole = data?.viewRole || false;
        this.skipReviewRole = data?.skipReviewRole || false;
        this.operations = data?.operations || [{ method: RoleMethods.GET }];
    }

    setName(name: string): void {
        this.name = name;
    }

    setDescription(description: string | undefined): void {
        this.description = description;
    }

    enableCreate(): RoleBlock {
        this.operations.push({ method: RoleMethods.POST });
        return this;
    }

    disableCreate(): RoleBlock {
        const index = this.operations.findIndex(e => e.method === RoleMethods.POST);
        this.operations.splice(index, 1);
        return this;
    }

    enableEdit(): RoleBlock {
        this.operations.push({ method: RoleMethods.PUT });
        return this;
    }

    disableEdit(): RoleBlock {
        const index = this.operations.findIndex(e => e.method === RoleMethods.PUT);
        this.operations.splice(index, 1);
        return this;
    }

    enableDelete(): RoleBlock {
        this.operations.push({ method: RoleMethods.DELETE });
        return this;
    }

    disableDelete(): RoleBlock {
        const index = this.operations.findIndex(e => e.method === RoleMethods.DELETE);
        this.operations.splice(index, 1);
        return this;
    }

    enableReview(): RoleBlock {
        this.operations.push({ method: RoleMethods.REVIEW });
        return this;
    }

    disableReview(): RoleBlock {
        const index = this.operations.findIndex(e => e.method === RoleMethods.REVIEW);
        this.operations.splice(index, 1);
        return this;
    }

    enableSkipReview(): RoleBlock {
        this.operations.push({ method: RoleMethods.SKIP_REVIEW });
        return this;
    }

    disableSkipReview(): RoleBlock {
        const index = this.operations.findIndex(e => e.method === RoleMethods.SKIP_REVIEW);
        this.operations.splice(index, 1);
        return this;
    }
}


export enum RoleMethods {
    GET = 'GET',
    PUT = 'PUT',
    POST = 'POST',
    DELETE = 'DELETE',
    REVIEW = 'REVIEW',
    SKIP_REVIEW = 'SKIP_REVIEW'
}

export class ErrorResponse {
    statusCode?: number;
    body?: object;
    message?: string;
    constructor(data: ErrorResponse | any) {
        if (typeof data === 'string') {
            this.statusCode = 500;
            this.body = { message: data };
            this.message = 'Internal Error';
        } else {
            this.statusCode = data?.statusCode;
            this.body = data?.body;
            this.message = data?.statusMessage;
        }
    }
}

export class SuccessResponse {
    message: string;
    [key: string]: any;
    constructor(data: SuccessResponse | any) {
        this.message = data?.message;
    }
}


export class DataStackDocument {
    _id: number | undefined;
    _metadata: Metadata | undefined;
    [key: string]: any;
    constructor(data: any) {
        Object.assign(this, data);
        this._id = data?._id;
        this._metadata = new Metadata(data?._metadata);
    }
}

export class Metadata {
    deleted: boolean;
    lastUpdated: Date | undefined;
    lastUpdatedBy: string;
    createdAt: Date | undefined;
    version: {
        document: number,
        release: string;
    } | undefined;
    constructor(data: Metadata) {
        this.deleted = data?.deleted || false;
        this.lastUpdated = data?.lastUpdated ? new Date(data?.lastUpdated) : undefined;
        this.lastUpdatedBy = data?.lastUpdatedBy || '';
        this.createdAt = data?.createdAt ? new Date(data?.createdAt) : undefined;
        this.version = data?.version;
    }
}


export class WebHook {
    name: string;
    url: string;
    failMessage: string;
    constructor(data: WebHook) {
        this.name = data.name;
        this.url = data.url;
        this.failMessage = data.failMessage;
    }
}


export class SchemaField {
    private key: string | undefined;
    private type: SchemaFieldTypes;
    private properties: SchemaFieldProperties;
    private definition: SchemaField[];
    constructor(data?: SchemaField) {
        this.key = data?.key;
        this.type = data?.type || SchemaFieldTypes.STRING;
        this.properties = new SchemaFieldProperties(data?.properties);
        this.definition = [];
        if (data?.definition) {
            this.definition = data?.definition.map(e => new SchemaField(e));
        }
    }

    newField(data?: SchemaField) {
        return new SchemaField(data);
    }

    getName() {
        return this.properties.getName();
    }

    setName(name: string): void {
        this.properties.setName(name);
        this.key = camelCase(name);
    }

    getKey() {
        return this.key;
    }

    setKey(key: string): void {
        this.key = key;
        this.setName(startCase(key));
    }

    getType() {
        return this.type;
    }

    setType(type: SchemaFieldTypes): SchemaField {
        this.type = type;
        if (this.type === SchemaFieldTypes.ARRAY) {
            const childField = new SchemaField();
            childField.setKey('_self');
            return childField;
        } else {
            return this;
        }
    }

    addChildField(data: SchemaField) {
        this.type = SchemaFieldTypes.OBJECT;
        this.definition.push(data);
        return this;
    }

    removeChildField(name: string) {
        const index = this.definition.findIndex(e => e.getName() === name);
        this.definition.splice(index, 1);
        return this;
    }

    getProperties() {
        return this.properties;
    }
}

export enum SchemaFieldTypes {
    STRING = 'String',
    NUMBER = 'Number',
    BOOLEAN = 'Boolean',
    DATA = 'Data',
    OBJECT = 'Object',
    ARRAY = 'Array',
    RELATION = 'Relation',
    SCHEMA = 'Global',
    LOCATION = 'Geojson',
}


export class SchemaFieldProperties {
    private name: string | undefined;
    private required: boolean;
    private unique: boolean;
    private createOnly: boolean;
    private email: boolean;
    private password: boolean;
    private enum: string[];
    private tokens: string[];
    private maxLength: number | undefined;
    private minLength: number | undefined;
    private max: number | undefined;
    private min: number | undefined;
    private pattern: string | undefined;
    private default: string | undefined;
    private relatedTo: string | undefined;
    private schema: string | undefined;
    private dateType: string | undefined;

    constructor(data?: SchemaFieldProperties) {
        this.name = data?.name;
        this.required = data?.required || false;
        this.unique = data?.unique || false;
        this.createOnly = data?.createOnly || false;
        this.email = data?.email || false;
        this.password = data?.password || false;
        this.enum = data?.enum || [];
        this.tokens = data?.tokens || [];
        this.maxLength = data?.maxLength;
        this.minLength = data?.minLength;
        this.max = data?.max;
        this.min = data?.min;
        this.pattern = data?.pattern;
        this.default = data?.default;
        this.relatedTo = data?.relatedTo;
        this.schema = data?.schema;
        this.dateType = data?.dateType;
    }

    public getName(): string | undefined {
        return this.name;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public isRequired(): boolean {
        return this.required;
    }

    public setRequired(required: boolean): void {
        this.required = required;
    }

    public isUnique(): boolean {
        return this.unique;
    }

    public setUnique(unique: boolean): void {
        this.unique = unique;
    }

    public isCreateOnly(): boolean {
        return this.createOnly;
    }

    public setCreateOnly(createOnly: boolean): void {
        this.createOnly = createOnly;
    }

    public isEmail(): boolean {
        return this.email;
    }

    public setEmail(email: boolean): void {
        this.email = email;
    }

    public isPassword(): boolean {
        return this.password;
    }

    public setPassword(password: boolean): void {
        this.password = password;
    }

    public getMaxLength(): number | undefined {
        return this.maxLength;
    }

    public setMaxLength(maxLength: number): void {
        this.maxLength = maxLength;
    }

    public getMinLength(): number | undefined {
        return this.minLength;
    }

    public setMinLength(minLength: number): void {
        this.minLength = minLength;
    }

    public getMax(): number | undefined {
        return this.max;
    }

    public setMax(max: number): void {
        this.max = max;
    }

    public getMin(): number | undefined {
        return this.min;
    }

    public setMin(min: number): void {
        this.min = min;
    }

    public getPattern(): string | undefined {
        return this.pattern;
    }

    public setPattern(pattern: string): void {
        this.pattern = pattern;
    }

    public getDefault(): string | undefined {
        return this.default;
    }

    public setDefault(value: string): void {
        this.default = value;
    }

    public getRelatedTo(): string | undefined {
        return this.relatedTo;
    }

    public setRelatedTo(relatedTo: string): void {
        this.relatedTo = relatedTo;
    }

    public getSchema(): string | undefined {
        return this.schema;
    }

    public setSchema(schema: string): void {
        this.schema = schema;
    }

}