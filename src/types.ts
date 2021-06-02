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
    host?: string;
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
    token?: string;
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
    filter: object | undefined;
    constructor(data: ListOptions) {
        this.select = data.select;
        this.sort = data.sort;
        this.page = data.page;
        this.count = data.count;
        this.filter = data.filter;
    }
}

export class DataService {
    _id: string | undefined;
    name: string | undefined;
    description: string | undefined;
    api: string | undefined;
    definition: Array<Definition> | undefined;
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

    constructor(data?: DataService) {
        this._id = data?._id;
        this.name = data?.name;
        this.description = data?.description;
        this.api = data?.api;
        this.definition = data?.definition;
        this.preHooks = data?.preHooks || [];
        this.webHooks = data?.webHooks || [];
        this.workflowHooks = data?.workflowHooks || { postHooks: { approve: [], discard: [], reject: [], rework: [], submit: [] } };
        this.role = data?.role || { fields: {}, roles: [new RoleBlock()] };
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


export class Definition {
    name: string | undefined;
    key: string | undefined;
    type: string | undefined;
    properties: DefinitionProperties | undefined;
}

export class DefinitionProperties {
    required: boolean;
    unique: boolean;
    createOnly: boolean;
    maxLength: number | undefined;
    minLength: number | undefined;
    max: number | undefined;
    min: number | undefined;
    pattern: string | undefined;
    default: string | number | boolean | undefined;
    relatedTo: string | undefined;
    schema: string | undefined;
    constructor(data?: DefinitionProperties) {
        this.required = data?.required || false;
        this.unique = data?.unique || false;
        this.createOnly = data?.createOnly || false;
        this.maxLength = data?.maxLength;
        this.minLength = data?.minLength;
        this.max = data?.max;
        this.min = data?.min;
        this.pattern = data?.pattern;
        this.default = data?.default;
        this.relatedTo = data?.relatedTo;
        this.schema = data?.schema;
    }
}

export class ErrorResponse {
    statusCode: number;
    body: object;
    message?: string;
    constructor(data: ErrorResponse | any) {
        this.statusCode = data.statusCode;
        this.body = data.body;
        this.message = data.statusMessage;
    }
}


export class DataStackDocument {
    _id: number | undefined;
    _metadata: Metadata | undefined;
    [key: string]: any;
    constructor(data: any) {
        Object.assign(this, data);
        this._id = data._id;
        this._metadata = new Metadata(data._metadata);
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
        this.deleted = data.deleted || false;
        this.lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : undefined;
        this.lastUpdatedBy = data.lastUpdatedBy || '';
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.version = data.version;
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