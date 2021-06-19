import React from 'react';
import ReactDOM from 'react-dom';
import Options from './Options.jsx';
import ErrorBoundary from '../ErrorBoundary.jsx';

ReactDOM.render(
    <ErrorBoundary context={"options page"}>
        <Options/>
    </ErrorBoundary>,
    document.querySelector('main'));
