export default function search(windows, filter) {
    if (filter.length == 0) {
        return windows;
    }

    let new_windows = [];
    const regex = new RegExp(filter, 'i');
    for (let i = 0; i < windows.length; i++) {
        let temp = [];
        for (let j = 0; j < windows[i].tabs.length; j++) {
            if (windows[i].tabs[j].title.match(regex) || windows[i].tabs[j].url.match(regex)) {
                temp.push(windows[i].tabs[j]);
            }
        }

        if (temp.length > 0) {
            new_windows.push({
                tabs: temp,
                title: windows[i].title
            });
        }
    }

    return new_windows;
}
