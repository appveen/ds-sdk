import { Credentials, App, ListOptions, ErrorResponse, DataService, DataStackDocument, WebHook, RoleBlock } from './types';
export declare function authenticateByCredentials(creds: Credentials): Promise<DataStack>;
export declare function authenticateByToken(creds: Credentials): Promise<DataStack>;
export declare class DataStack {
    api: string;
    constructor();
    ListApps(): Promise<DSApp[]>;
    App(name: string): Promise<DSApp>;
}
export declare class DSApp {
    app: App;
    api: string;
    constructor(app: App);
    ListDataServices(): Promise<DSDataService[]>;
    DataService(name: string): Promise<DSDataService>;
}
export declare class DSDataService {
    app: App;
    data: DataService;
    api: string;
    constructor(app: App, data: DataService);
    Start(): Promise<ErrorResponse>;
    Stop(): Promise<ErrorResponse>;
    ScaleUp(): Promise<ErrorResponse>;
    ScaleDown(): Promise<ErrorResponse>;
    Repair(): Promise<ErrorResponse>;
    getIntegrations(): DSDataServiceIntegration;
    setIntegrations(data: DSDataServiceIntegration): Promise<DSDataService>;
    getRoles(): DSDataServiceRoles;
    setRoles(data: DSDataServiceRoles): Promise<DSDataService>;
    CRUD(): CRUDMethods;
}
export declare class DSDataServiceRoles {
    app: App;
    data: DataService;
    api: string;
    constructor(app: App, data: DataService);
    listRoles(): RoleBlock[];
    getRole(name: string): RoleBlock | undefined;
    createNewRole(name: string, description?: string): RoleBlock;
    addRole(data: RoleBlock): this;
    removeRole(name: string): this;
}
export declare class DSDataServiceIntegration {
    app: App;
    data: DataService;
    api: string;
    constructor(app: App, data: DataService);
    listPreHook(): WebHook[];
    getPreHook(name: string): WebHook | undefined;
    addPreHook(data: WebHook): this;
    removePreHook(name: string): this;
    listPostHook(): WebHook[];
    getPostHook(name: string): WebHook | undefined;
    addPostHook(data: WebHook): this;
    removePostHook(name: string): this;
}
export declare class CRUDMethods {
    app: App;
    data: DataService;
    api: string;
    constructor(app: App, data: DataService);
    Count(): Promise<number>;
    List(options: ListOptions): Promise<DataStackDocument[]>;
    Get(id: string): Promise<DataStackDocument>;
    Put(id: string, data: any): Promise<DataStackDocument>;
    Post(data: any): Promise<DataStackDocument>;
    Delete(id: string): Promise<ErrorResponse>;
}
declare const _default: {
    authenticateByCredentials: typeof authenticateByCredentials;
    authenticateByToken: typeof authenticateByToken;
};
export default _default;
