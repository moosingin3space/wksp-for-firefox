import React, { useState, useEffect, useReducer, useCallback } from 'react';
import search from '../search';
import activateTab from '../activateTab';

import styles from './palette.module.css';
import colors from '../colorSchemes.module.css';
import commonStyles from '../common.module.css';

async function openSettings() {
    await browser.runtime.openOptionsPage();
    window.close();
}

const Selectable = ({ highlighted, onHighlightChanged, children }) => {
    const handleMove = (e) => {
        e.stopPropagation();
        onHighlightChanged(true);
    };

    const handleMouseExit = (e) => {
        e.stopPropagation();
        onHighlightChanged(false);
    };

    return (
        <div
            className={`panel-list-item ${highlighted ? styles.highlightedItem : ''}`}
            onMouseMove={handleMove}
            onMouseLeave={handleMouseExit}
        >
            <div className={styles.flexParent}>
                { children }
            </div>
        </div>
    );
};

const Img = ({ src, fallbackSrc, ...props}) => {
    const [src, setSrc] = useState(src);

    return <img
                src={src}
                onError={() => setSrc(fallbackSrc)}
                {...props}
            />
};

const Palette = () => {
    const initialState = {
        filter: '',
        allWindows: [],
        filteredWindows: [],
        containers: [],
        shouldCloseOnClose: false,
        highlight: {
            window: -1,
            tab: -1,
        },
    };

    const constrain = (filteredWindows, highlight) => {
        if (highlight.tab < 0) {
            highlight.window--;
            if (highlight.window >= 0) {
                highlight.tab = filteredWindows[highlight.window].tabs.length-1;
            }
        }

        if (highlight.window < 0) {
            highlight.window = -1;
            return highlight;
        }

        if (highlight.window >= filteredWindows.length) {
            highlight.window = filteredWindows.length-1;
        }

        if (highlight.tab >= filteredWindows[highlight.window].tabs.length) {
            if (highlight.window == filteredWindows.length-1) {
                highlight.tab = filteredWindows[highlight.window].tabs.length-1;
            } else {
                highlight.window++;
                highlight.tab = 0;
            }
        }

        return highlight;
    };

    const attachContainers = containers => {
        let containersById = {};
        for (const ctr of containers) {
            containersById[ctr.cookieStoreId] = ctr;
        }
        return windows => windows.map(win => {
            win.tabs = win.tabs.map(tab => {
                if (tab.cookieStoreId && containersById.hasOwnProperty(tab.cookieStoreId)) {
                    tab.container = containersById[tab.cookieStoreId];
                }
                return tab;
            });
            return win;
        });
    };

    const reducer = (state = initialState, action) => {
        switch (action.type) {
            case "INITIAL_FETCH":
                const applyWindows = attachContainers(action.containers);
                return {
                    ...state,
                    allWindows: applyWindows(action.windows),
                    filteredWindows: applyWindows(action.windows),
                    containers: action.containers,
                    shouldCloseOnClose: action.shouldCloseOnClose,
                }
            case "FETCH_NEW_WINDOWS":
                const applyWindows = attachContainers(state.containers);
                return {
                    ...state,
                    allWindows: applyWindows(action.windows),
                    filteredWindows: search(applyWindows(action.windows), state.filter),
                }
            case "FILTER":
                return {
                    ...state,
                    filter: action.filter,
                    filteredWindows: search(state.allWindows, action.filter),
                }
            case "HIGHLIGHT":
                return {
                    ...state,
                    highlight: {
                        window: action.window,
                        tab: action.tab,
                    },
                }
            case "HIGHLIGHT_UP":
                let oldHighlight = state.highlight;
                oldHighlight.tab--;
                const highlight = constrain(state.filteredWindows, oldHighlight);
                return {
                    ...state,
                    highlight,
                }
            case "HIGHLIGHT_DOWN":
                let oldHighlight = state.highlight;
                if (oldHighlight.window < 0) {
                    oldHighlight.window = 0;
                    oldHighlight.tab = 0;
                } else {
                    oldHighlight.tab++;
                }
                const highlight = constrain(state.filteredWindows, oldHighlight);
                return {
                    ...state,
                    highlight,
                }
            default:
                return state
        }
    };
    const [state, dispatch] = useReducer(reducer, initialState);

    const activateSpecificTab = async (tabId, teleport=false) => {
        await activateTab(tabId, teleport);
        window.close();
    };

    const activateTopTab = useCallback(async (teleport=false) => {
        if (state.filteredWindows.length == 0) {
            return;
        }
        if (state.filteredWindows[0].tabs.length == 0) {
            return;
        }
        const tab = state.filteredWindows[0].tabs[0];
        activateSpecificTab(tab.id, teleport);
    }, [state, dispatch]);

    const closeTab = useCallback(async (tabId) => {
        if (state.shouldCloseOnClose) {
            await browser.tabs.remove(tabId);
            window.close();
        } else {
            await browser.tabs.remove(tabId);
            const windows = await browser.runtime.sendMessage({ type: 'get_mru' });
            dispatch({
                type: 'FETCH_NEW_WINDOWS',
                windows,
            });
        }
    }, [state, dispatch]);

    const handleKeyDown = useCallback(async (event) => {
        event.stopPropagation();
        if (event.keyCode == 13) {
            // enter
            const teleport = event.shiftKey; // shift+enter teleports tab into the current window
            if (state.highlight.window < 0 || state.highlight.tab < 0) {
                activateTopTab(teleport);
            } else {
                const tab = state.windows[state.highlight.window].tabs[state.highlight.tab];
                activateSpecificTab(tab.id, teleport);
            }
        } else if (event.keyCode == 38) {
            // up
            dispatch({ type: 'HIGHLIGHT_UP' });
        } else if (event.keyCode == 40) {
            // down
            dispatch({ type: 'HIGHLIGHT_DOWN' });
        } else if (event.keyCode == 191) {
            // slash (jump back to search)
            event.preventDefault();
            dispatch({
                type: 'HIGHLIGHT',
                window: -1,
                tab: -1,
            });
        }
    }, [state, dispatch, activateTopTab, activateSpecificTab]);

    useEffect(() => {
        const fetchData = async () => {
            const [windows, containers, storedOpts] = await Promise.all([
                browser.runtime.sendMessage({ type: 'get_mru' }),
                browser.contextualIdentities.query({}),
                browser.storage.local.get({ shouldCloseOnClose: false }),
            ]);

            dispatch({
                type: 'INITIAL_FETCH',
                windows,
                containers,
                shouldCloseOnClose: storedOpts.shouldCloseOnClose,
            });
        };
        fetchData();
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className={`${colors.top} ${styles.wrapper} browser-style`}>
            <div className={styles.filterBox}>
                <input
                    className={`${styles.search} browser-style`}
                    type="search"
                    value={state.filter}
                    onChange={(e) => dispatch({ type: 'FILTER', filter: e.target.value })}
                    placeholder="Filter..."
                    autoFocus
                />
                <div
                    className={styles.preferencesIcon}
                    title="Open extension settings"
                    onClick={() => openSettings()}
                />
            </div>
            {state.filteredWindows.map((win, i) => (
                <div key={`window${i}`} className={`panel-section-list`}>
                    <div className={`${styles.noOverflow} panel-section-header`}>
                        <span className={`${styles.ellipsis} text-section-header ${commonStyles.heading}`}>{ win.title }</span>
                    </div>
                    {win.tabs.map((tab, j) => (
                        <Selectable
                            key={`window${i}-tab${j}`}
                            highlighted={state.highlight.window == i && state.highlight.tab == j}
                            onHighlightChanged={(isHighlighted) => {
                                if (isHighlighted) {
                                    dispatch({ type: 'HIGHLIGHT', window: i, tab: j });
                                }
                            }}
                        >
                            <div
                                className={`${styles.fullWidth} ${styles.maybeContainer} ${tab.container ? styles.yesContainer : ''}`}
                                onClick={() => activateSpecificTab(tab.id)}
                                style={tab.container ? {
                                    borderBottomColor: tab.container.colorCode,
                                } : null}
                            >
                                <div className={styles.noOverflow}>
                                    { tab.favIconUrl
                                        ? <Img
                                            className="icon"
                                            src={tab.favIconUrl}
                                            fallbackSrc="palette/static/folder-16.svg"
                                            alt="favicon"
                                            width={16}
                                            height={16}
                                          />
                                        : <Img
                                            className="icon"
                                            src="palette/static/folder-16.svg"
                                            alt="no favicon"
                                            width={16}
                                            height={16}
                                          /> }
                                    <span className={`${styles.text} ${styles.ellipsis}`}>{ tab.title }</span>
                                </div>
                            </div>
                            <div className={styles.controls}>
                                <div
                                    className={styles.pasteIcon}
                                    title="Paste tab into current window"
                                    onClick={() => activateSpecificTab(tab.id, true)}
                                />
                                <div
                                    className={styles.closeIcon}
                                    title="Close tab"
                                    onClick={() => closeTab(tab.id)}
                                />
                            </div>
                        </Selectable>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Palette;
