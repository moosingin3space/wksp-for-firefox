import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errMsg: null };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            errMsg: error.toString(),
        };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div>
                    <h1>
                        Something went wrong.
                    </h1>
                    <p>{this.state.errMsg}</p>
                    <p>when loading context {this.props.context}</p>
                </div>
            );
        }

        return this.props.children;
    }
};

export default ErrorBoundary;
