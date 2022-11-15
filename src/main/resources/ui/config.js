let defaultValue = {
    dark: false
}

let config = {};

function load() {
    const localStorage = window.localStorage;
    for (const key in defaultValue) {
        if (Object.hasOwnProperty.call(defaultValue, key)) {
            const element = localStorage.getItem(key);
            if (element == null) {
                config[key] = defaultValue[key];
            } else {
                switch (typeof defaultValue[key]) {
                    case 'string':
                        config[key] = element;
                        break;
                    case 'number':
                        config[key] = parseFloat(element);
                        break;
                    case 'boolean':
                        config[key] = element == 'true';
                        break;
                    default:
                        config[key] = element;
                }
            }
        }
    }
}

function save() {
    const localStorage = window.localStorage;
    for (const key in config) {
        if (Object.hasOwnProperty.call(config, key)) {
            const element = config[key];
            localStorage.setItem(key, element);
        }
    }
}

function update(key, value){
    window.localStorage.setItem(key, value);
}

load();