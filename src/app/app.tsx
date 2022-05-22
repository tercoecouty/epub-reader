import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./app.less";

import Header from "./Header";
import Sidebar from "./Sidebar";
import BookText from "./BookText";

import { selectFilePath, selectHash, selectEpub, appActions } from "../slice/appSlice";

export default function App() {
    const dispatch = useDispatch();
    const epub = useSelector(selectEpub);
    const filePath = useSelector(selectFilePath);
    const hash = useSelector(selectHash);

    // useEffect(() => {
    //     if (epub && filePath === "") {
    //         const readingOrder = epub.getReadingOrder();
    //         dispatch(appActions.setFilePath(readingOrder[1]));
    //     }
    // }, [epub, filePath]);

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
            <Header />
            <main>
                <Sidebar />
                <BookText />
            </main>

            {/* <div className="page-buttons">
                <button onClick={handlePrevPage}>Prev Page</button>
                <button onClick={handleNextPage}>Next Page</button>
            </div> */}
        </div>
    );
}
