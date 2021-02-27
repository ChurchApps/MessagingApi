import { DB } from "../db";
import { Page } from "../models";

export class PageRepository {

    public save(page: Page) {
        if (page.id > 0) return this.update(page); else return this.create(page);
    }

    public async create(page: Page) {
        const query = "INSERT INTO pages (churchId, name, content, lastModified) VALUES (?, ?, ?, NOW());";
        const params = [page.churchId, page.name, page.content];
        return DB.query(query, params).then((row: any) => { page.id = row.insertId; return page; });
    }

    public async update(page: Page) {
        const query = "UPDATE pages SET name=?, content=?, lastModified=NOW() WHERE id=? AND churchId=?;";
        const params = [page.name, page.content, page.id, page.churchId];
        return DB.query(query, params).then(() => { return page });
    }

    public async delete(id: number, churchId: number) {
        DB.query("DELETE FROM pages WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async loadById(id: number, churchId: number): Promise<Page> {
        return DB.queryOne("SELECT * FROM pages WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async loadAll(churchId: number): Promise<Page[]> {
        return DB.query("SELECT * FROM pages WHERE churchId=?;", [churchId]);
    }


}
