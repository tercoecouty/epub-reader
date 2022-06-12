import JSZip from "jszip";

interface IMetaData {
    title: string;
    author: string;
    description: string;
    publisher: string;
    cover: string;
    language: string;
}

export interface IBookTableItem {
    title: string;
    path: string;
    children: IBookTableItem[];
}

export default class Epub {
    private pathPrefix: string = "";
    private zip: JSZip = null;
    private parser = new DOMParser();
    private metaData: IMetaData;
    private manifest: Map<string, string> = new Map(); // id -> path
    private readingOrder: string[] = []; // list of paths
    private bookTable: IBookTableItem[] = [];
    private textFileCache: Map<string, string> = new Map(); // path -> fileText
    private blobFileUrlCache: Map<string, string> = new Map(); // path -> object url

    constructor() {}

    async load(data: File | Blob) {
        this.zip = await JSZip.loadAsync(data);

        const container = this.parser.parseFromString(await this.getTextFile("META-INF/container.xml"), "text/xml");
        const splits = container.querySelector("rootfile")?.getAttribute("full-path").split("/");
        if (splits.length !== 1) {
            this.pathPrefix = splits[0] + "/";
        }

        const opfPath = splits.slice(-1)[0];
        const opfDOM = this.parser.parseFromString(await this.getTextFile(opfPath), "text/xml");

        this.metaData = {
            title: opfDOM.getElementsByTagName("dc:title")[0]?.textContent || "",
            author: opfDOM.getElementsByTagName("dc:creator")[0]?.textContent || "",
            description: opfDOM.getElementsByTagName("dc:description")[0]?.textContent || "",
            publisher: opfDOM.getElementsByTagName("dc:publisher")[0]?.textContent || "",
            cover: "",
            language: opfDOM.getElementsByTagName("dc:language")[0]?.textContent || "",
        };
        if (this.metaData.language === "") {
            if (this.metaData.title.match(/^[\u0020-\u007e]+$/)) {
                this.metaData.language = "en";
            }
        }

        let ncxPath = "toc.ncx";
        for (const item of opfDOM.querySelectorAll("manifest > item")) {
            const href = item.getAttribute("href");
            this.manifest.set(item.id, href);
            if (href.endsWith(".ncx")) ncxPath = href;
        }

        for (const item of opfDOM.querySelectorAll("spine > itemref")) {
            const path = this.manifest.get(item.getAttribute("idref"));
            this.readingOrder.push(encodeURIComponent(path));
        }

        const ncxDOM = this.parser.parseFromString(await this.getTextFile(ncxPath), "text/xml");

        this.bookTable = this.parseNavPoint(ncxDOM.querySelectorAll("navMap > navPoint"));
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

        for (const item of items) {
            const title = item.querySelector("navLabel > text").textContent;
            const path = item.querySelector("content").getAttribute("src") || "";
            const navPoints = Array.from(item.children as any[]).filter((ele) => ele.tagName === "navPoint");
            const children = navPoints.length ? this.parseNavPoint(navPoints) : null;
            _bookTable.push({ title, path, children });
        }

        return _bookTable;
    }

    async getTextFile(path: string) {
        if (this.textFileCache.has(path)) return this.textFileCache.get(path);

        const file = this.zip.file(this.pathPrefix + decodeURIComponent(path));
        if (!file) return "";

        const text = await file.async("text");
        this.textFileCache.set(path, text);

        return text;
    }

    async getBlobFileUrl(path: string) {
        if (this.blobFileUrlCache.has(path)) return this.blobFileUrlCache.get(path);

        const file = this.zip.file(this.pathPrefix + decodeURIComponent(path));
        if (!file) return "";

        let type = "";
        if (path.endsWith(".svg")) type = "image/svg+xml";
        else if (path.endsWith(".png")) type = "image/png";
        else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) type = "image/jpeg";

        const blob = await file.async("blob");
        const url = URL.createObjectURL(new Blob([blob], { type }));
        this.blobFileUrlCache.set(path, url);

        return url;
    }
}
