export class ArrayHelper {
    static getIds(array: any[], propertyName: string) {
        const result: number[] = [];
        for (const item of array) {
            const id = parseInt(item[propertyName], 0);
            if (id > 0 && result.indexOf(id) === -1) result.push(id);
        }
        return result;
    }

    static getOne(array: any[], propertyName: string, value: any) {
        for (const item of array) if (item[propertyName] === value) return item;
        return null
    }

    static getAll(array: any[], propertyName: string, value: any) {
        const result: any[] = []
        for (const item of array) if (item[propertyName] === value) result.push(item);
        return result;
    }
}
