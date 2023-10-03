import { configureStore } from "@reduxjs/toolkit";

import appReducer from "./slice/appSlice";

const store = configureStore({
    reducer: {
        app: appReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredPaths: ["app.epub"],
                ignoredActions: ["app/setEpub"],
            },
        }),
    devTools: import.meta.env.DEV,
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
