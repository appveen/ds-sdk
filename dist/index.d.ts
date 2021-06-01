import { Credentials, App, ListOptions, ErrorResponse, DataService, DataStackDocument } from './types';
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
    CRUD(): CRUDMethods;
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
