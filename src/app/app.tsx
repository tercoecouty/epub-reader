import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import "./app.less";

import Upload from "../component/Upload";
import BookTable from "./BookTable";

import Epub from "./Epub";

import { selectFilePath, selectHash, appActions } from "../slice/appSlice";

export default function App() {
    const dispatch = useDispatch();
    const [epub, setEpub] = useState<Epub>(null);
    const filePath = useSelector(selectFilePath);
    const hash = useSelector(selectHash);

    useEffect(() => {
        setTimeout(async () => {
            const res = await fetch("./jane.epub");
            const blob = await res.blob();
            const _epub = await new Epub().load(blob);
            setEpub(_epub);
        }, 0);
    }, []);

    const handleInputChange = async (file: File) => {
        if (epub) epub.clearCache();

        const _epub = await new Epub().load(file);
        setEpub(_epub);
        dispatch(appActions.setFilePath(""));
        dispatch(appActions.setHash(""));
    };

    useEffect(() => {
        if (epub && filePath === "") {
            const readingOrder = epub.getReadingOrder();
            dispatch(appActions.setFilePath(readingOrder[1]));
        }
    }, [epub, filePath]);

    const resolvePath = (htmlPath: string, href: string) => {
        let pathList = htmlPath.split("/");
        pathList.pop();
        for (const item of href.split("/")) {
            if (item === "..") pathList.pop();
            else pathList.push(item);
        }

        return pathList.join("/");
    };

    const setReferHtml = async (filePath: string) => {
        const dom_referHtml = document.getElementById("refer-html");
        if (dom_referHtml.dataset.filePath === filePath) return;

        const htmlText = await epub.getTextFile(filePath);
        let match: any;

        let bodyText = "";
        match = htmlText.match(/<body.+?>(.+)<\/body>/s);
        if (match) {
            bodyText = match[1];
            for (let match of bodyText.matchAll(/<img.+?>/g)) {
                const imgText = match[0];
                match = imgText.match(/src="(.+?)"/);
                if (match) {
                    const imgSrc = match[1];
                    const newImgText = imgText.replace(imgSrc, "");
                    bodyText = bodyText.replace(imgText, newImgText);
                }
            }
        }

        dom_referHtml.innerHTML = bodyText;
        dom_referHtml.dataset.filePath = filePath;
    };

    const setHtml = async (filePath: string) => {
        const htmlText = await epub.getTextFile(filePath);
        let match: any, matches: any;

        const oldStyles = document.querySelectorAll(".epub-link-style");

        // link
        matches = htmlText.matchAll(/<link.+?>/gs);
        for (match of matches) {
            const linkText = match[0];
            match = linkText.match(/href="(.+?)"/);
            if (match) {
                const href = match[1];
                const linkPath = resolvePath(filePath, href);
                let cssText = await epub.getTextFile(linkPath);

                const _matches = cssText.matchAll(/url\((.+?)\)/gs);
                for (const _match of _matches) {
                    const src = _match[1];
                    const srcPath = resolvePath(linkPath, src);
                    const srcUrl = await epub.getBlobFileUrl(srcPath);
                    cssText = cssText.replace(src, srcUrl);
                }

                const dom_style = document.createElement("style");
                dom_style.className = "epub-link-style";
                dom_style.textContent = cssText;
                document.head.append(dom_style);
            }
        }

        for (const style of oldStyles) style.remove();

        // body
        let bodyText = "";
        match = htmlText.match(/<body.+?>(.+)<\/body>/s);
        if (match) {
            bodyText = match[1];
            for (let match of bodyText.matchAll(/<img.+?>/g)) {
                const imgText = match[0];
                match = imgText.match(/src="(.+?)"/);
                if (match) {
                    const imgSrc = match[1];
                    const imgPath = resolvePath(filePath, imgSrc);
                    const imgUrl = await epub.getBlobFileUrl(imgPath);
                    const newImgText = imgText.replace(imgSrc, imgUrl);
                    bodyText = bodyText.replace(imgText, newImgText);
                }
            }
        }

        document.getElementById("text-html").innerHTML = bodyText;
        window.scrollTo(0, 0);

        // if (!SET_NOTE) return;

        const getHrefDom = (dom: Element) => {
            if (!dom.getAttribute("href")) {
                if (dom.nextElementSibling?.getAttribute("href")) {
                    return dom.nextElementSibling;
                }
            }
            return dom;
        };

        // book notes
        document.getElementById("refer-text").textContent = "";

        let dom_links = [...document.querySelectorAll("#text-html a[id]")];
        if (dom_links.length === 0) return;

        for (let i = 0; i < dom_links.length; i++) {
            dom_links[i] = getHrefDom(dom_links[i]);
        }

        match = dom_links[0].getAttribute("href")?.match(/(.+html)#.+$/);
        if (!match) return;

        const hrefPath = match[1];
        const referPath = resolvePath(filePath, hrefPath);
        await setReferHtml(referPath);

        let refers = {};
        const visitedLinks: Map<string, Element> = new Map();
        for (const dom_link of dom_links) {
            match = dom_link.getAttribute("href").match(/html#(.+)$/);
            if (!match) continue;

            const referId = match[1];
            let dom_refer = document.getElementById(referId);
            // 多个文件的注释放在最后，注释列表的第一个注释不在当前文件
            if (!dom_refer) {
                const dom_container = dom_link.parentElement.id === "text-html" ? dom_link : dom_link.parentElement;
                while (dom_container.nextElementSibling) {
                    dom_container.nextElementSibling.remove();
                }
                while (dom_container.nextSibling) {
                    dom_container.nextSibling.remove();
                }
                if (dom_container.previousElementSibling) {
                    dom_container.previousElementSibling.remove();
                }
                dom_container.remove();
                break;
            }

            dom_refer = getHrefDom(dom_refer) as HTMLElement;

            const referIndex = dom_refer.textContent.trim();
            // 当前文件的注释放在当前文件，注释列表的第一个注释已经被访问过
            if (visitedLinks.has(referIndex)) {
                const dom_container = dom_link.parentElement.id === "text-html" ? dom_link : dom_link.parentElement;
                while (dom_container.nextElementSibling) {
                    dom_container.nextElementSibling.remove();
                }
                while (dom_container.nextSibling) {
                    dom_container.nextSibling.remove();
                }
                if (dom_container.previousElementSibling) {
                    dom_container.previousElementSibling.remove();
                }
                dom_container.remove();
                break;
            } else {
                visitedLinks.set(referIndex, dom_link);
            }

            const dom_container =
                dom_refer.parentElement.id in ["text-html", "refer-html"] ? dom_refer : dom_refer.parentElement;
            let referText = dom_container.textContent.replace(referIndex, "").trim();
            if (referText === "" && dom_container.nextSibling.nodeName === "#text") {
                referText = dom_container.nextSibling.textContent.trim();
            }

            refers[referIndex] = referText;
        }

        for (const [referIndex, dom_link] of visitedLinks) {
            if (dom_link.parentElement.localName !== "sup") {
                dom_link.outerHTML = `<span class="book-note book-note-sup">${referIndex}</span>`;
            } else {
                dom_link.outerHTML = `<span class="book-note">${referIndex}</span>`;
            }
        }

        document.getElementById("refer-text").textContent = JSON.stringify(refers, null, 4);
    };

    useEffect(() => {
        if (filePath) {
            setHtml(filePath);
            location.hash = filePath;
        }
    }, [filePath]);

    useEffect(() => {
        if (hash) {
            const dom = document.getElementById(hash);
            if (dom) dom.scrollIntoView();
        } else {
            window.scrollTo(0, 0);
        }
    }, [hash]);

    const handleNextPage = () => {
        const readingOrder = epub.getReadingOrder();

        if (filePath) {
            const index = readingOrder.indexOf(filePath);
            if (index === -1 || index === readingOrder.length - 1) return;

            dispatch(appActions.setFilePath(readingOrder[index + 1]));
            dispatch(appActions.setHash(""));
        } else {
            dispatch(appActions.setFilePath(readingOrder[1]));
        }
    };

    const handlePrevPage = () => {
        if (!filePath) return;

        const readingOrder = epub.getReadingOrder();
        const index = readingOrder.indexOf(filePath);
        if (index === -1 || index === 1) return;

        dispatch(appActions.setFilePath(readingOrder[index - 1]));
        dispatch(appActions.setHash(""));
    };

    return (
        <div className="app">
            <Upload accept=".epub" onChange={handleInputChange} />
            <BookTable bookTable={epub ? epub.getBookTable() : []} />
            <div className="text">
                <div id="text-html" className="text-html"></div>
                <div className="refer-html" id="refer-html"></div>
            </div>
            <div className="page-buttons">
                <button onClick={handlePrevPage}>Prev Page</button>
                <button onClick={handleNextPage}>Next Page</button>
            </div>
            <pre className="refer-text" id="refer-text"></pre>
        </div>
    );
}
