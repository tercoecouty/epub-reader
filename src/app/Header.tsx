import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectEpub, appActions } from "../slice/appSlice";
import "./Header.less";
import Epub from "./Epub";

export default function Header() {
    const dispatch = useDispatch();
    const epub = useSelector(selectEpub);

    const handleFileChange = async (e) => {
        if (epub) epub.clearCache();

        const file = e.target.files[0] as File;
        const _epub = await new Epub().load(file);
        dispatch(appActions.setEpub(_epub));
        dispatch(appActions.setFilePath(""));
        dispatch(appActions.setHash(""));
        // (window as any).epub = _epub;
        document.getElementById("text-html").replaceChildren();
        document.title = _epub.getMetaData().title;
        if (_epub.getMetaData().language === "en") {
            document.getElementById("text-html").classList.add("en");
        } else {
            document.getElementById("text-html").classList.remove("en");
        }
    };

    // useEffect(() => {
    //     setTimeout(async () => {
    //         const res = await fetch("./jane.epub");
    //         const blob = await res.blob();
    //         const _epub = await new Epub().load(blob);
    //         dispatch(appActions.setEpub(_epub));
    //         (window as any).epub = _epub;
    //     }, 0);
    // }, []);

    // useEffect(() => {
    //     setTimeout(async () => {
    //         let res = await fetch("./1.html");
    //         const htmlText = await res.text();
    //         const parser = new DOMParser();
    //         const htmlDOM = parser.parseFromString(htmlText, "text/html");
    //         (window as any).htmlDOM = htmlDOM;
    //     }, 0);
    // }, []);

    return (
        <header>
            <input type="file" accept=".epub" onChange={handleFileChange}></input>
        </header>
    );
}
