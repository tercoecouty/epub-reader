import React from "react";
import "./Icon.less";

interface IIconProps {
    svg: string;
}

export default class Icon extends React.Component<IIconProps> {
    private ref;
    constructor(props) {
        super(props);
        this.ref = React.createRef();
    }

    componentDidMount() {
        this.ref.current.innerHTML = this.props.svg;
    }

    componentDidUpdate() {
        this.ref.current.innerHTML = this.props.svg;
    }

    render() {
        return <span ref={this.ref} className="icon"></span>;
    }
}
