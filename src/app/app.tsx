import "./app.less";

import Header from "./Header";
import Sidebar from "./Sidebar";
import BookText from "./BookText";

export default function App() {
    return (
        <div className="app">
            <Header />
            <main>
                <Sidebar />
                <BookText />
            </main>
        </div>
    );
}
