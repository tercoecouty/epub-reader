import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import Epub from "../app/Epub";

interface IBookState {
    filePath: string;
    hash: string;
    epub: Epub;
}

const initialState: IBookState = {
    filePath: "",
    hash: "",
    epub: null,
};

const appSlice = createSlice({
    name: "app",
    initialState,
    reducers: {
        setFilePath: (state, actions: PayloadAction<string>) => {
            state.filePath = actions.payload;
        },
        setHash: (state, actions: PayloadAction<string>) => {
            state.hash = actions.payload;
        },
        setEpub: (state, actions: PayloadAction<Epub>) => {
            state.epub = actions.payload;
        },
    },
});

export default appSlice.reducer;
export const appActions = appSlice.actions;
export const selectFilePath = (state: RootState) => state.app.filePath;
export const selectHash = (state: RootState) => state.app.hash;
export const selectEpub = (state: RootState) => state.app.epub;
