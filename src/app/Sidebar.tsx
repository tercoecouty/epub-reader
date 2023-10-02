import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./Sidebar.less";

import { IBookTableItem } from "./Epub";
import { selectFilePath, selectHash, selectEpub, appActions } from "../slice/appSlice";

import Icon from "../component/Icon";
import rightSvg from "./svg/right.svg?raw";
import downSvg from "./svg/down.svg?raw";

export default function Sidebar() {
    const dispatch = useDispatch();
    const epub = useSelector(selectEpub);
    const filePath = useSelector(selectFilePath);
    const hash = useSelector(selectHash);
    const [expands, setExpands] = useState({});
    const [autoScroll, setAutoScroll] = useState(false);

    const handleClickIcon = (e) => {
        const path = e.target.closest(".book-table-item").dataset.path;
        expands[path] = !expands[path];
        setExpands({ ...expands });
    };

    const handleClickTitle = async (e) => {
        let path = e.target.closest(".book-table-item").dataset.path;
        let _filePath = "";
        let _hash = "";

        const match = path.match(/(.+html)(#.+)?$/);
        if (!match) return;

        _filePath = match[1];
        if (match[2]) _hash = match[2].slice(1);

        if (_filePath !== filePath) {
            dispatch(appActions.setFilePath(_filePath));
            dispatch(appActions.setHash(_hash));
            return;
        }

        if (_hash !== hash) {
            dispatch(appActions.setHash(_hash));
        }
    };

    let currentPathFlag = false;
    const renderBookTable = (bookTable: IBookTableItem[]) => {
        const renderedBookTable = [];
        let keyIndex = 0;
        let titleClassName = "";
        for (const item of bookTable) {
            if (!currentPathFlag && item.path.includes(filePath)) {
                titleClassName = "book-table-item-title currentPath";
                currentPathFlag = true;
            } else {
                titleClassName = "book-table-item-title";
            }

            if (item.children) {
                renderedBookTable.push(
                    <div className="book-table-items" key={keyIndex++}>
                        <div className="book-table-item" data-path={item.path}>
                            <div className="book-table-item-icon" onClick={handleClickIcon}>
                                <Icon svg={expands[item.path] ? downSvg : rightSvg}></Icon>
                            </div>
                            <div className={titleClassName} onClick={handleClickTitle} title={item.title}>
                                {item.title}
                            </div>
                        </div>
                        <div className="book-table-items-list">
                            {expands[item.path] ? renderBookTable(item.children) : null}
                        </div>
                    </div>
                );
            } else {
                renderedBookTable.push(
                    <div className="book-table-item" key={keyIndex++} data-path={item.path}>
                        <div className={titleClassName} onClick={handleClickTitle}>
                            {item.title}
                        </div>
                    </div>
                );
            }
        }

        return renderedBookTable;
    };

    const _setExpands = (bookTable: IBookTableItem[], expand) => {
        for (const item of bookTable) {
            if (item.children) {
                expands[item.path] = expand;
                _setExpands(item.children, expand);
            }
        }
    };

    const fold = () => {
        for (const path of Object.keys(expands)) expands[path] = false;
        setExpands({ ...expands });
    };

    useEffect(() => {
        if (!epub) return;

        _setExpands(epub.getBookTable(), false);
        setExpands({ ...expands });
    }, [epub]);

    useEffect(() => {
        if (!epub) return;

        const parentPaths = [];
        const searchFilePath = (bookTable: IBookTableItem[]) => {
            for (const item of bookTable) {
                if (item.path.includes(filePath)) return true;

                if (item.children) {
                    const result = searchFilePath(item.children);
                    if (result) {
                        parentPaths.push(item.path);
                        return true;
                    }
                }
            }

            return false;
        };

        searchFilePath(epub.getBookTable());

        // 自动折叠目录
        // for (const path of Object.keys(expands)) expands[path] = false;

        for (const path of parentPaths) expands[path] = true;
        setExpands({ ...expands });
        setAutoScroll(true);
    }, [filePath]);

    useEffect(() => {
        if (!autoScroll) return;

        function isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        }

        const ele = document.querySelector(".currentPath");
        if (ele && !isInViewport(ele)) {
            document.querySelector(".currentPath").scrollIntoView();
        }
        setAutoScroll(false);
    }, [autoScroll]);

    return (
        <aside className="book-table">
            <div className="sidebar-buttons">
                <button onClick={fold}>折叠</button>
            </div>
            {epub ? renderBookTable(epub.getBookTable()) : null}
        </aside>
    );
}
