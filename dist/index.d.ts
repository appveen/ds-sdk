import { Credentials, App, ListOptions, ErrorResponse, DataService, DataStackDocument, WebHook, RoleBlock, SchemaField, SuccessResponse, WorkflowRespond } from './types';
export declare function authenticateByCredentials(creds: Credentials): Promise<DataStack>;
export declare function authenticateByToken(creds: Credentials): Promise<DataStack>;
export declare class DataStack {
    api: string;
    constructor();
    Logout(): Promise<void>;
    ListApps(): Promise<DSApp[]>;
    App(name: string): Promise<DSApp>;
    CreateApp(name: string): Promise<DSApp>;
    DeleteApp(name: string): Promise<DataStack>;
}
export declare class DSApp {
    app: App;
    api: string;
    private managementAPIs;
    private dataServiceMap;
    constructor(app: App);
    private CreateDataServiceMap;
    RepairAllDataServices(): Promise<SuccessResponse[]>;
    StartAllDataServices(): Promise<DSApp>;
    StopAllDataServices(): Promise<DSApp>;
    ListDataServices(): Promise<DSDataService[]>;
    SearchDataServices(options: ListOptions): Promise<DSDataService[]>;
    DataService(name: string): Promise<DSDataService>;
    CreateDataService(name: string, description?: string): Promise<DSDataService>;
    TransactionAPI(): TransactionMethods;
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
    WorkflowAPIs(): WorkflowMethods;
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
    CountRecords(filter?: any): Promise<number>;
    ListRecords(options: ListOptions): Promise<DataStackDocument[]>;
    GetRecord(id: string): Promise<DataStackDocument>;
    UpdateRecord(id: string, data: any): Promise<DataStackDocument>;
    UpsertRecord(id: string, data: any): Promise<DataStackDocument>;
    CreateRecord(data: any): Promise<DataStackDocument>;
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
export declare class WorkflowMethods {
    app: App;
    data: DataService;
    api: string;
    constructor(app: App, data: DataService);
    private getPendingRecordIdsOfUser;
    CreateRespondData(): WorkflowRespond;
    ApproveRecords(ids: string[], respondData: WorkflowRespond): Promise<SuccessResponse | ErrorResponse>;
    RejectRecords(ids: string[], respondData: WorkflowRespond): Promise<SuccessResponse | ErrorResponse>;
    ReworkRecords(ids: string[], respondData: WorkflowRespond): Promise<SuccessResponse | ErrorResponse>;
    ApproveRecordsRequestedBy(user: string, respondData: WorkflowRespond): Promise<SuccessResponse | ErrorResponse>;
    RejectRecordsRequestedBy(user: string, respondData: WorkflowRespond): Promise<SuccessResponse | ErrorResponse>;
    ReworkRecordsRequestedBy(user: string, respondData: WorkflowRespond): Promise<SuccessResponse | ErrorResponse>;
}
export declare class TransactionMethods {
    app: App;
    api: string;
    private dataServiceMap;
    private payload;
    constructor(app: App, dataServiceMap: any);
    CreateOperation(dataService: string, data: DataStackDocument): TransactionMethods;
    UpdateOperation(dataService: string, data: DataStackDocument, upsert?: boolean): TransactionMethods;
    DeleteOperation(dataService: string, data: DataStackDocument): TransactionMethods;
    Execute(): Promise<any | ErrorResponse>;
}
declare const _default: {
    authenticateByCredentials: typeof authenticateByCredentials;
    authenticateByToken: typeof authenticateByToken;
};
export default _default;
