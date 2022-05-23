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

    // hash改变时无法处理高亮
    const renderBookTable = (bookTable: IBookTableItem[]) => {
        const renderedBookTable = [];
        let keyIndex = 0;
        for (const item of bookTable) {
            let titleClassName = "book-table-item-title";
            let path = filePath;
            if (hash) path += "#" + hash;
            if (item.path === path) titleClassName += " currentPath";

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
        _setExpands(epub.getBookTable(), false);
        setExpands({ ...expands });
    };

    const unfold = () => {
        _setExpands(epub.getBookTable(), true);
        setExpands({ ...expands });
    };

    useEffect(() => {
        if (!epub) return;

        _setExpands(epub.getBookTable(), false);
        setExpands({ ...expands });
    }, [epub]);

    return (
        <aside className="book-table">
            <div className="sidebar-buttons">
                <button onClick={unfold}>展开</button>
                <button onClick={fold}>折叠</button>
            </div>
            {epub ? renderBookTable(epub.getBookTable()) : null}
        </aside>
    );
}
