import { Credentials, App, ListOptions, ErrorResponse, DataService, DataStackDocument, WebHook, RoleBlock, SchemaField, SuccessResponse, WorkflowRespond, FileUploadResponse, Yamls } from './types';
interface AuthData {
    _id: string | undefined;
    uuid: string | undefined;
    token: string | undefined;
    rToken: string | undefined;
    isSuperAdmin: boolean;
    expiresIn: number | undefined;
    rbacBotTokenDuration: number | undefined;
    rbacHbInterval: number | undefined;
    rbacUserCloseWindowToLogout: boolean;
    rbacUserToSingleSession: boolean;
    rbacUserTokenDuration: number | undefined;
    rbacUserTokenRefresh: boolean;
    serverTime: number | undefined;
    defaultTimezone: string | undefined;
    bot: boolean;
}
export declare function authenticateByCredentials(creds: Credentials): Promise<DataStack>;
export declare function authenticateByToken(creds: Credentials): Promise<DataStack>;
export declare class DataStack {
    authData: AuthData;
    api: string;
    constructor(data: AuthData);
    Logout(): Promise<void>;
    CountApps(filter?: any): Promise<DSApp[]>;
    ListApps(options: ListOptions): Promise<DSApp[]>;
    App(name: string): Promise<DSApp>;
    CreateApp(name: string): Promise<DSApp>;
    DeleteApp(name: string): Promise<DataStack>;
}
export declare class DSApp {
    app: App;
    api: string;
    private dataServiceMap;
    constructor(app: App);
    private CreateDataServiceMap;
    RepairAllDataServices(filter: any): Promise<SuccessResponse[]>;
    StartAllDataServices(filter: any): Promise<SuccessResponse[]>;
    StopAllDataServices(filter: any): Promise<SuccessResponse[]>;
    CountDataServices(filter?: any): Promise<DSApp[]>;
    ListDataServices(options: ListOptions): Promise<DSDataService[]>;
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
    Yamls(): Promise<Yamls | ErrorResponse>;
    Start(): Promise<SuccessResponse | ErrorResponse>;
    Stop(): Promise<SuccessResponse | ErrorResponse>;
    ScaleUp(): Promise<SuccessResponse | ErrorResponse>;
    ScaleDown(): Promise<SuccessResponse | ErrorResponse>;
    Repair(): Promise<SuccessResponse | ErrorResponse>;
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
    NewDocument(data?: any): DataStackDocument;
    CountRecords(filter?: any): Promise<number>;
    ListRecords(options: ListOptions): Promise<DataStackDocument[]>;
    GetRecord(id: string): Promise<DataStackDocument>;
    UpdateRecord(id: string, data: any, options?: {
        expireAt?: string | number;
        expireAfter?: string;
        filter?: any;
        useFilter?: boolean;
    }): Promise<DataStackDocument>;
    UpsertRecord(id: string, data: any, options?: {
        expireAt?: string | number;
        expireAfter?: string;
        filter?: any;
        useFilter?: boolean;
    }): Promise<DataStackDocument>;
    CreateRecord(data: any, options?: {
        expireAt: string | number;
        expireAfter: string;
    }): Promise<DataStackDocument>;
    DeleteRecord(id: string): Promise<ErrorResponse>;
    BulkDeleteRecords(options: {
        ids?: string[];
        filter?: any;
    }): Promise<ErrorResponse>;
    PrepareMath(): MathAPI;
    ApplyMath(id: string, math: MathAPI): Promise<DataStackDocument>;
    UploadFileFromPath(filePath: string): Promise<FileUploadResponse>;
    UploadFileAsStream(data: any): Promise<FileUploadResponse>;
    DownloadFileAsStream(data: any): Promise<any>;
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
