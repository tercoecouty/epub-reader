import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import "./index.less";

import App from "./app/app";
import store from "./store";

ReactDOM.createRoot(document.getElementById("root")).render(
    <Provider store={store}>
        <App />
    </Provider>
);
