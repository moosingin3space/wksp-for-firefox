import React from 'react';
import ReactDOM from 'react-dom';
import Palette from './Palette.jsx';
import ErrorBoundary from '../ErrorBoundary.jsx';

ReactDOM.render(
    <ErrorBoundary context={"palette"}>
        <Palette/>
    </ErrorBoundary>,
    document.querySelector('main'));
