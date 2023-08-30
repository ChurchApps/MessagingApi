import { BasePermissions } from "@churchapps/apihelper";

export class Permissions extends BasePermissions {
    static chat = {
        host: { contentType: "Chat", action: "Host" }
    }
}