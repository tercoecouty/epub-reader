import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./BookText.less";

import { selectFilePath, selectHash, selectEpub, appActions } from "../slice/appSlice";

export default function BookText() {
    const dispatch = useDispatch();
    const epub = useSelector(selectEpub);
    const filePath = useSelector(selectFilePath);
    const hash = useSelector(selectHash);

    const resolvePath = (htmlPath: string, href: string) => {
        let pathList = htmlPath.split("/");
        pathList.pop();
        for (const item of href.split("/")) {
            if (item === "..") pathList.pop();
            else pathList.push(item);
        }

        return pathList.join("/");
    };

    const setBookText = async (filePath: string) => {
        console.time(`loadPage ${filePath}`);
        const parser = new DOMParser();
        const htmlDOM = parser.parseFromString(await epub.getTextFile(filePath), "text/html");

        const oldStyles = document.querySelectorAll(".epub-link-style");

        // link
        for (const dom_link of htmlDOM.querySelectorAll("link")) {
            const href = dom_link.getAttribute("href");
            const linkPath = resolvePath(filePath, href);
            let cssText = await epub.getTextFile(linkPath);
            cssText = cssText.replaceAll(/url\(.+?\)/g, "none"); // 移除CSS中的url()
            const dom_style = document.createElement("style");
            dom_style.className = "epub-link-style";
            dom_style.textContent = cssText;
            document.head.append(dom_style);
            dom_link.remove(); // 有些不规范的epub文件的link会出现在body中
        }

        for (const style of oldStyles) style.remove();

        // img
        for (const dom_img of htmlDOM.querySelectorAll("img")) {
            const imgSrc = dom_img.getAttribute("src");
            const imgPath = resolvePath(filePath, imgSrc);
            const imgUrl = await epub.getBlobFileUrl(imgPath);
            dom_img.setAttribute("src", imgUrl);
        }

        // text
        for (const dom of htmlDOM.querySelectorAll("body > *")) {
            for (const node of dom.childNodes) {
                if (node.nodeType !== 3) continue;
                let text = node.textContent;
                text = text.replaceAll(/([\u0021-\u007e])([\u4e00-\u9fa5])/g, "$1 $2");
                text = text.replaceAll(/([\u4e00-\u9fa5])([\u0021-\u007e])/g, "$1 $2");
                node.textContent = text;
            }
        }

        console.timeEnd(`loadPage ${filePath}`);

        document.getElementById("text-html").replaceChildren(...htmlDOM.body.children);

        if (hash) {
            const dom = document.getElementById(hash);
            if (dom) {
                dom.scrollIntoView({
                    block: "center",
                });
            }
        } else {
            window.scrollTo(0, 0);
        }
    };

    useEffect(() => {
        if (filePath) {
            setBookText(filePath);
        }
    }, [filePath]);

    useEffect(() => {
        const dom = document.getElementById(hash);
        if (dom) {
            dom.scrollIntoView({
                block: "center",
            });
        } else {
            window.scrollTo(0, 0);
        }
    }, [hash]);

    const handleTextClick = (e) => {
        e.preventDefault();
        const dom_a = e.target.closest("a");
        if (!dom_a) return;

        const href = dom_a.getAttribute("href");
        if (!href) return;

        if (href.startsWith("http")) {
            // 外部链接
            window.open(href, "_blank");
            return;
        }

        const url = new URL(href, "http:localhost/" + filePath);
        const _filePath = url.pathname.slice(1);
        const _hash = url.hash.slice(1);
        if (_filePath !== filePath) {
            dispatch(appActions.setFilePath(_filePath));
        }
        dispatch(appActions.setHash(_hash));
    };

    return (
        <React.Fragment>
            <div className="text" id="text">
                <div id="text-html" className="text-html" onClick={handleTextClick}></div>
            </div>
        </React.Fragment>
    );
}
