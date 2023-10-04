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

        const nodes = document.querySelectorAll<HTMLElement>(".epub-link-style");
        const oldStyles = [...nodes.values()];

        // link
        for (const dom_link of htmlDOM.querySelectorAll("link")) {
            const href = dom_link.getAttribute("href");
            const linkPath = resolvePath(filePath, href);

            // 如果当前页面里面有这个CSS文件，不再插入
            let index = oldStyles.findIndex((s) => s.dataset["linkPath"] === linkPath);
            if (index !== -1) {
                oldStyles.splice(index, 1);
                continue;
            }

            let cssText = await epub.getTextFile(linkPath);
            // 移除CSS中的url()
            cssText = cssText.replaceAll(/url\(.+?\)/g, "none");
            // 移除CSS中对body和div的样式设置，防止影响到页面
            cssText = cssText.replaceAll(/(body|div).?{.+?}/gs, "");
            const dom_style = document.createElement("style");
            dom_style.className = "epub-link-style";
            dom_style.dataset["linkPath"] = linkPath;
            dom_style.textContent = cssText;
            document.head.append(dom_style);

            // 有些不规范的epub文件的link会出现在body中
            // 需要删除，不然会加入到#text-html里面
            dom_link.remove();
        }

        // 在上一个页面的样式添加之后移除之前的样式，防止页面瞬间变化
        for (const style of oldStyles) style.remove();

        // img
        for (const dom_img of htmlDOM.querySelectorAll("img")) {
            const imgSrc = dom_img.getAttribute("src");
            const imgPath = resolvePath(filePath, imgSrc);
            const imgUrl = await epub.getImgUrl(imgPath);
            dom_img.setAttribute("src", imgUrl);
        }

        // text
        // 在汉字和ascii字符间添加空格
        // for (const dom of htmlDOM.querySelectorAll("body > *")) {
        //     for (const node of dom.childNodes) {
        //         if (node.nodeType !== 3) continue;
        //         let text = node.textContent;
        //         text = text.replaceAll(/([\u0021-\u007e])([\u4e00-\u9fa5])/g, "$1 $2");
        //         text = text.replaceAll(/([\u4e00-\u9fa5])([\u0021-\u007e])/g, "$1 $2");
        //         node.textContent = text;
        //     }
        // }

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
