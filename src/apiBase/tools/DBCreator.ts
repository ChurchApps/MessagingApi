import dotenv from "dotenv";
import fs from "fs-extra";
import { DB } from "../db";

export class DBCreator {

    private static tables: { title: string, file: string }[] = [
        { title: "Answers", file: "answers.mysql" },
        { title: "Forms", file: "forms.mysql" },
        { title: "FormSubmissions", file: "formSubmissions.mysql" },
        { title: "Links", file: "links.mysql" },
        { title: "Notes", file: "notes.mysql" },
        { title: "Pages", file: "pages.mysql" },
        { title: "Settings", file: "settings.mysql" },
        { title: "Questions", file: "questions.mysql" }
    ]

    public static async init(selectedTables: string[]) {
        dotenv.config();

        const todo: { title: string, file: string }[] = [];
        selectedTables.forEach(async st => {
            this.tables.forEach(async t => {
                if (t.title === st) todo.push(t);
            });
        });

        for (const td of todo) await this.runScript(td.title, "./src/apiBase/tools/dbScripts/" + td.file, false);
        return;
    }

    public static async runScript(title: string, file: string, customDelimeter: boolean) {
        console.log("Creating '" + title + "'");
        const sql = await fs.readFile(file, { encoding: "UTF-8" });
        let del = /;(?=END)\s*$|;(?!\nEND)\s*$/gm;
        if (customDelimeter) {
            del = /\$\$$/gm;
        }
        const statements = sql.split(del);
        for (const statement of statements) if (statement.length > 3) await DB.query(statement, []);
    }


}