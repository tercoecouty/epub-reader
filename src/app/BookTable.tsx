import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import "./BookTable.less";

import Icon from "../component/Icon";

import { IBookTableItem } from "./Epub";
import { selectFilePath, selectHash, appActions } from "../slice/appSlice";

import rightSvg from "./svg/right.svg?raw";
import downSvg from "./svg/down.svg?raw";

interface IBookTableProps {
    bookTable?: IBookTableItem[];
}

function BookTable(props: IBookTableProps) {
    const dispatch = useDispatch();
    const { bookTable } = props;
    const filePath = useSelector(selectFilePath);
    const hash = useSelector(selectHash);
    const [expands, setExpands] = useState({});

    useEffect(() => {
        const _setExpands = (bookTable: IBookTableItem[]) => {
            for (const item of bookTable) {
                if (item.children) {
                    expands[item.path] = false;
                    _setExpands(item.children);
                }
            }
        };

        _setExpands(bookTable);

        setExpands({ ...expands });
    }, [bookTable]);

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
                            <div className={titleClassName} onClick={handleClickTitle}>
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

    return <div className="book-table">{renderBookTable(bookTable)}</div>;
}

export default BookTable;
