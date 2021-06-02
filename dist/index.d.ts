import { Credentials, App, ListOptions, ErrorResponse, DataService, DataStackDocument, WebHook, RoleBlock, SchemaField, SchemaFieldTypes } from './types';
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
    private api;
    private smApi;
    constructor(app: App, data: DataService);
    Start(): Promise<ErrorResponse>;
    Stop(): Promise<ErrorResponse>;
    ScaleUp(): Promise<ErrorResponse>;
    ScaleDown(): Promise<ErrorResponse>;
    Repair(): Promise<ErrorResponse>;
    getIntegrations(): DSDataServiceIntegration;
    setIntegrations(data: DSDataServiceIntegration): Promise<DSDataService>;
    getRoles(): DSDataServiceRole;
    setRoles(data: DSDataServiceRole): Promise<DSDataService>;
    getSchema(): DSDataServiceSchema;
    setSchema(data: DSDataServiceSchema): Promise<DSDataService>;
    CRUD(): CRUDMethods;
    private createPayload;
    private cleanPayload;
}
export declare class DSDataServiceRole {
    private app;
    private data;
    private api;
    constructor(app: App, data: DataService);
    getData(): DataService;
    listRoles(): RoleBlock[];
    getRole(name: string): RoleBlock | undefined;
    createNewRole(name: string, description?: string): RoleBlock;
    addRole(data: RoleBlock): DSDataServiceRole;
    removeRole(name: string): DSDataServiceRole;
}
export declare class DSDataServiceIntegration {
    private app;
    private data;
    private api;
    constructor(app: App, data: DataService);
    getData(): DataService;
    listPreHook(): WebHook[];
    getPreHook(name: string): WebHook | undefined;
    addPreHook(data: WebHook): DSDataServiceIntegration;
    removePreHook(name: string): DSDataServiceIntegration;
    listPostHook(): WebHook[];
    getPostHook(name: string): WebHook | undefined;
    addPostHook(data: WebHook): DSDataServiceIntegration;
    removePostHook(name: string): DSDataServiceIntegration;
}
export declare class DSDataServiceSchema {
    private app;
    private data;
    private api;
    constructor(app: App, data: DataService);
    getData(): DataService;
    getJSONSchema(): WebHook[];
    setJSONSchema(schema: any): WebHook[];
    newField(data?: SchemaField): SchemaField;
    getField(name: string): SchemaField | undefined;
    addField(data: SchemaField): this;
    patchField(data: SchemaField): this;
    removeField(name: string): this;
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
    SchemaFieldTypes: typeof SchemaFieldTypes;
};
export default _default;
