import * as ZipJS from "@zip.js/zip.js";

export default class Epub2 {
    constructor() {}

    async load(data: File | Blob) {
        const zip = new ZipJS.ZipReader(new ZipJS.BlobReader(data));
        window["zip"] = zip;
        window["ZipJS"] = ZipJS;

        console.time("getEntries");
        const entries = await zip.getEntries();
        window["entries"] = entries;
        console.timeEnd("getEntries");

        window["getData"] = async function (index) {
            console.time("getData");
            const blob = await entries[index].getData(new ZipJS.BlobWriter());
            console.timeEnd("getData");

            console.time("text");
            const text = await blob.text();
            console.timeEnd("text");
        };
    }
}
