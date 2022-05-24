import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./Header.less";
import Epub from "./Epub";

import { selectEpub, selectFilePath, appActions } from "../slice/appSlice";

export default function Header() {
    const dispatch = useDispatch();
    const epub = useSelector(selectEpub);
    const filePath = useSelector(selectFilePath);

    const loadFile = async (file: File) => {
        const _epub = await new Epub().load(file);
        const readingOrder = _epub.getReadingOrder();
        dispatch(appActions.setEpub(_epub));
        dispatch(appActions.setFilePath(readingOrder[1]));
        dispatch(appActions.setHash(""));

        document.getElementById("text-html").replaceChildren();
        document.title = _epub.getMetaData().title;
        if (_epub.getMetaData().language.includes("en")) {
            document.getElementById("text-html").classList.add("en");
        } else {
            document.getElementById("text-html").classList.remove("en");
        }
    };

    const handleFileChange = async (e) => {
        if (epub) epub.clearCache();

        const file = e.target.files[0] as File;
        await loadFile(file);
    };

    const nextPage = () => {
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

    const prevPage = () => {
        if (!filePath) return;

        const readingOrder = epub.getReadingOrder();
        const index = readingOrder.indexOf(filePath);
        if (index === -1 || index === 1) return;

        dispatch(appActions.setFilePath(readingOrder[index - 1]));
        dispatch(appActions.setHash(""));
    };

    useEffect(() => {
        document.body.ondragover = (e) => {
            e.preventDefault();
        };
        document.body.ondrop = (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0] as File;
            if (!file) return;
            if (!file.name.endsWith(".epub")) return;
            loadFile(file);
        };
    }, []);

    return (
        <header>
            <input type="file" accept=".epub" onChange={handleFileChange}></input>
            <div className="page-buttons">
                <button onClick={prevPage}>上一页</button>
                <button onClick={nextPage}>下一页</button>
            </div>
        </header>
    );
}
