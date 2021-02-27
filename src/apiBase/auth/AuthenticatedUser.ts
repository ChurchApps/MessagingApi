import { Principal } from "./"
import { IPermission } from "../helpers/Interfaces";

export class AuthenticatedUser {
    // public details: any;
    public id: number;
    public churchId: number;
    public email: string;
    public apiName: string;
    public permissions: string[];

    public constructor(principal: Principal) {
        this.id = principal.details.id;
        this.churchId = principal.details.churchId;
        this.permissions = principal.details.permissions;
        this.apiName = principal.details.apiName;
    }

    public checkAccess(permission: IPermission) {
        const key = permission.contentType + "__" + permission.action;
        let result = false;
        this.permissions.forEach((p: string) => { if (p === key) result = true; });
        return result;
    }

    /*
    public checkAccess(contentType: string, action: string) {
        const key = contentType + "__" + action;
        let result = false;
        this.permissions.forEach((p: string) => { if (p === key) result = true; });
        return result;
    }
    */



}
