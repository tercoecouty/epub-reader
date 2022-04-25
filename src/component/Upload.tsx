import "./Upload.less";

interface IUploadProps {
    onChange?: (file: File) => void;
    accept?: string;
}

export default function Upload(props: IUploadProps) {
    const accept = props.accept || "";
    const onChange = props.onChange;

    const handleOnChange = (e) => {
        const file = e.target.files[0];
        if (onChange) onChange(file);
    };

    const handleOnClick = (e) => {
        document.getElementById("upload-file").click();
    };

    return (
        <div className="upload" onClick={handleOnClick}>
            <div>选择文件</div>
            <input type="file" id="upload-file" accept={accept} hidden onChange={handleOnChange}></input>
        </div>
    );
}
