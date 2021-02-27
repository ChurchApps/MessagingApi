export class Permissions {
    static forms = {
        view: { contentType: "Forms", action: "View" },
        edit: { contentType: "Forms", action: "Edit" }
    };
    static links = {
        edit: { contentType: "Links", action: "Edit" }
    };
    static notes = {
        view: { contentType: "Notes", action: "View" },
        edit: { contentType: "Notes", action: "Edit" }
    };
    static pages = {
        edit: { contentType: "Pages", action: "Edit" }
    };
    static settings = {
        edit: { contentType: "Settings", action: "Edit" }
    };
}