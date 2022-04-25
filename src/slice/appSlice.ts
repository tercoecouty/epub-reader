import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface IBookState {
    filePath: string;
    hash: string;
}

const initialState: IBookState = {
    filePath: "",
    hash: "",
};

const appSlice = createSlice({
    name: "book",
    initialState,
    reducers: {
        setFilePath: (state, actions: PayloadAction<string>) => {
            state.filePath = actions.payload;
        },
        setHash: (state, actions: PayloadAction<string>) => {
            state.hash = actions.payload;
        },
    },
});

export default appSlice.reducer;
export const appActions = appSlice.actions;
export const selectFilePath = (state: RootState) => state.app.filePath;
export const selectHash = (state: RootState) => state.app.hash;
