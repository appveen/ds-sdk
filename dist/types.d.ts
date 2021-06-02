export declare class App {
    _id: string | undefined;
    description: string | undefined;
    appCenterStyle: AppCenterStyle | undefined;
    logo: Logo | undefined;
    users: Array<string> | undefined;
    groups: Array<string> | undefined;
    constructor(data?: App);
}
export declare class AppCenterStyle {
    theme: string | undefined;
    bannerColor: string | undefined;
    primaryColor: string | undefined;
    textColor: string | undefined;
    constructor(data?: AppCenterStyle);
}
export declare class Logo {
    full: string | undefined;
    thumbnail: string | undefined;
    constructor(data?: Logo);
}
export declare class UserDetails {
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
    constructor(data?: UserDetails);
}
export declare class Auth {
    isLdap: boolean | undefined;
    dn: string | undefined;
    authType: string | undefined;
    constructor(data?: Auth);
}
export declare class AccessControl {
    apps: App[] | undefined;
    accessLevel: string | undefined;
    constructor(data?: AccessControl);
}
export declare class BasicDetails {
    name: string | undefined;
    email: string | undefined;
    phone: string | undefined;
    constructor(data?: BasicDetails);
}
export declare class Credentials {
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
    constructor(data?: Credentials);
}
export declare class ListOptions {
    select: string | undefined;
    sort: string | undefined;
    page: number | undefined;
    count: number | undefined;
    filter: object | undefined;
    constructor(data: ListOptions);
}
export declare class DataService {
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
        };
    };
    role: {
        fields: {
            [key: string]: {
                _t: string;
                _p: {
                    [key: string]: string;
                };
            };
        };
        roles: Array<RoleBlock>;
    };
    constructor(data?: DataService);
}
export declare class RoleBlock {
    id: string;
    name: string | undefined;
    description: string | undefined;
    manageRole: boolean;
    viewRole: boolean;
    skipReviewRole: boolean;
    operations: Array<{
        method: RoleMethods;
    }>;
    constructor(data?: RoleBlock);
    setName(name: string): void;
    setDescription(description: string | undefined): void;
    enableCreate(): RoleBlock;
    disableCreate(): RoleBlock;
    enableEdit(): RoleBlock;
    disableEdit(): RoleBlock;
    enableDelete(): RoleBlock;
    disableDelete(): RoleBlock;
    enableReview(): RoleBlock;
    disableReview(): RoleBlock;
    enableSkipReview(): RoleBlock;
    disableSkipReview(): RoleBlock;
}
export declare enum RoleMethods {
    GET = "GET",
    PUT = "PUT",
    POST = "POST",
    DELETE = "DELETE",
    REVIEW = "REVIEW",
    SKIP_REVIEW = "SKIP_REVIEW"
}
export declare class Definition {
    name: string | undefined;
    key: string | undefined;
    type: string | undefined;
    properties: DefinitionProperties | undefined;
}
export declare class DefinitionProperties {
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
    constructor(data?: DefinitionProperties);
}
export declare class ErrorResponse {
    statusCode: number;
    body: object;
    message?: string;
    constructor(data: ErrorResponse | any);
}
export declare class DataStackDocument {
    _id: number | undefined;
    _metadata: Metadata | undefined;
    [key: string]: any;
    constructor(data: any);
}
export declare class Metadata {
    deleted: boolean;
    lastUpdated: Date | undefined;
    lastUpdatedBy: string;
    createdAt: Date | undefined;
    version: {
        document: number;
        release: string;
    } | undefined;
    constructor(data: Metadata);
}
export declare class WebHook {
    name: string;
    url: string;
    failMessage: string;
    constructor(data: WebHook);
}
