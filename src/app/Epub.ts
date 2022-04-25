import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

interface IMetaData {
    title: string;
    author: string;
    description: string;
    publisher: string;
    cover: string;
}

export interface IBookTableItem {
    title: string;
    path: string;
    children: IBookTableItem[];
}

export default class Epub {
    private pathPrefix: string = "";
    private zip: JSZip = null;
    private xmlParser: XMLParser = null;
    private metaData: IMetaData;
    private manifest: Map<string, string>; // id -> path
    private readingOrder: string[] = []; // list of paths
    private bookTable: IBookTableItem[] = [];
    private textFileCache: Map<string, string> = new Map(); // path -> fileText
    private blobFileUrlCache: Map<string, string> = new Map(); // path -> object url

    constructor() {
        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
        });
    }

    async load(data: File | Blob) {
        this.zip = await JSZip.loadAsync(data);

        this.pathPrefix = this.zip.file("OEBPS/content.opf") ? "OEBPS/" : "";

        const opf = await this.getParsedFile("content.opf");

        this.metaData = this.parseMetaData(opf["package"]["metadata"]);

        this.manifest = this.parseManifest(opf["package"]["manifest"]["item"]);
        if (this.manifest.has("cover")) this.metaData.cover = this.manifest.get("cover");

        this.readingOrder = this.parseSpine(opf["package"]["spine"]["itemref"]);

        const ncx = await this.getParsedFile("toc.ncx");

        this.bookTable = this.parseNavPoint(ncx["ncx"]["navMap"]["navPoint"]);
        this.normalizeBookTable(this.bookTable);

        return this;
    }

    clearCache() {
        for (const url of this.blobFileUrlCache.values()) {
            URL.revokeObjectURL(url);
        }
    }

    getReadingOrder() {
        return this.readingOrder;
    }

    getMetaData() {
        return this.metaData;
    }

    getBookTable() {
        return this.bookTable;
    }

    private normalizeBookTable(bookTable: IBookTableItem[]) {
        const getPath = (bookTable: IBookTableItem[]) => {
            let paths: string[] = [];
            for (const item of bookTable) {
                const filePath = item.path.replace(/html#.+$/, "html");
                paths.push(filePath);
                if (item.children) {
                    paths = paths.concat(getPath(item.children));
                }
            }
            return paths;
        };

        const paths = getPath(bookTable);
        const pathCount: Map<string, number> = new Map();
        for (const path of paths) {
            if (pathCount.has(path)) {
                pathCount.set(path, pathCount.get(path) + 1);
            } else {
                pathCount.set(path, 1);
            }
        }

        const travelBookTable = (bookTable: IBookTableItem[]) => {
            for (const item of bookTable) {
                const filePath = item.path.replace(/html#.+$/, "html");
                if (pathCount.get(filePath) === 1) {
                    item.path = filePath;
                }
                if (item.children) {
                    travelBookTable(item.children);
                }
            }
        };

        travelBookTable(bookTable);
    }

    private parseNavPoint(items) {
        const _bookTable = [];
        if (!Array.isArray(items)) items = [items];

        for (const item of items) {
            const title = item["navLabel"]["text"];
            const path = item["content"]["@_src"];
            const children = item["navPoint"] ? this.parseNavPoint(item["navPoint"]) : null;
            _bookTable.push({ title, path, children });
        }

        return _bookTable;
    }

    private parseSpine(items) {
        const _readingOrder = [];

        for (const item of items) {
            const path = this.manifest.get(item["@_idref"]);
            _readingOrder.push(path);
        }

        return _readingOrder;
    }

    private parseManifest(items) {
        const _manifest = new Map();

        for (const item of items) {
            _manifest.set(item["@_id"], item["@_href"]);
        }

        return _manifest;
    }

    private parseMetaData(data: any) {
        const parseMetadataItem = (item: any) => {
            if (!item) return "";

            if (typeof item === "string") return item;
            if ("#text" in item) return item["#text"];
            if (Array.isArray(item)) {
                return item.map((subItem) => parseMetadataItem(subItem)).join(", ");
            }
        };

        const _metaData: IMetaData = {
            title: parseMetadataItem(data["dc:title"]),
            author: parseMetadataItem(data["dc:creator"]),
            description: parseMetadataItem(data["dc:description"]),
            publisher: parseMetadataItem(data["dc:publisher"]),
            cover: "",
        };

        return _metaData;
    }

    private async getParsedFile(path: string) {
        const file = await this.getTextFile(path);
        const parsedFile = this.xmlParser.parse(file);
        return parsedFile;
    }

    async getTextFile(path: string) {
        if (this.textFileCache.has(path)) return this.textFileCache.get(path);

        const file = this.zip.file(this.pathPrefix + path);
        if (!file) return "";

        const text = await file.async("text");
        this.textFileCache.set(path, text);

        return text;
    }

    async getBlobFileUrl(path: string) {
        if (this.blobFileUrlCache.has(path)) return this.blobFileUrlCache.get(path);

        const file = this.zip.file(this.pathPrefix + path);
        if (!file) return "";

        const blob = await file.async("blob");
        const url = URL.createObjectURL(blob);
        this.blobFileUrlCache.set(path, url);

        return url;
    }
}
