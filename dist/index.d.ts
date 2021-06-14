import { Credentials, App, ListOptions, ErrorResponse, DataService, DataStackDocument, WebHook, RoleBlock, SchemaField } from './types';
export declare function authenticateByCredentials(creds: Credentials): Promise<DataStack>;
export declare function authenticateByToken(creds: Credentials): Promise<DataStack>;
export declare class DataStack {
    api: string;
    constructor();
    ListApps(): Promise<DSApp[]>;
    App(name: string): Promise<DSApp>;
    CreateApp(name: string): Promise<DSApp>;
    DeleteApp(name: string): Promise<DataStack>;
}
export declare class DSApp {
    app: App;
    api: string;
    private managementAPIs;
    constructor(app: App);
    StartAllDataServices(): Promise<DSApp>;
    StopAllDataServices(): Promise<DSApp>;
    ListDataServices(): Promise<DSDataService[]>;
    DataService(name: string): Promise<DSDataService>;
    CreateDataService(name: string, description?: string): Promise<DSDataService>;
}
export declare class DSDataService {
    app: App;
    data: DataService;
    private originalData;
    private draftData;
    private api;
    private smApi;
    private _isDraft;
    constructor(app: App, data: DataService);
    private FetchDraft;
    HasDraft(): boolean;
    IsDraft(): boolean;
    SwitchToDraft(): DSDataService;
    SwitchToOriginal(): DSDataService;
    DiscardDraft(): Promise<DSDataService>;
    PurgeAllData(): Promise<DSDataService>;
    PurgeApiLogs(): Promise<DSDataService>;
    PurgeAuditLogs(): Promise<DSDataService>;
    Delete(): Promise<DSApp>;
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
    DataAPIs(): DataMethods;
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
    newField(data?: SchemaField): SchemaField;
    getField(name: string): SchemaField | undefined;
    addField(data: SchemaField): this;
    patchField(data: SchemaField): this;
    removeField(name: string): this;
}
export declare class DataMethods {
    app: App;
    data: DataService;
    api: string;
    constructor(app: App, data: DataService);
    CountRecords(): Promise<number>;
    ListRecords(options: ListOptions): Promise<DataStackDocument[]>;
    GetRecord(id: string): Promise<DataStackDocument>;
    UpdateRecord(id: string, data: any): Promise<DataStackDocument>;
    UpsertRecord(id: string, data: any): Promise<DataStackDocument>;
    CreateRecord(data: any): Promise<DataStackDocument>;
    CascadeRecord(data: any): Promise<DataStackDocument>;
    DeleteRecord(id: string): Promise<ErrorResponse>;
    PrepareMath(): MathAPI;
    ApplyMath(id: string, math: MathAPI): Promise<DataStackDocument>;
}
export declare class MathAPI {
    private selectedField;
    private operations;
    constructor();
    SelectField(path: string): this;
    Increment(num: number): this;
    Multiply(num: number): this;
    CreatePayload(): any;
}
declare const _default: {
    authenticateByCredentials: typeof authenticateByCredentials;
    authenticateByToken: typeof authenticateByToken;
};
export default _default;
