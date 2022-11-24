var PathMan = function () {
    this.stack = [];
    this.add = function (dir) {
        this.stack.push(dir);
    }
    this.remove = function () {
        this.stack.pop();
    }
    this.setPath = function (path) {
        let dirs = path.split('/');
        this.stack = [];
        for (let dir of dirs) {
            if (dir != '') {
                this.stack.push(decodeURIComponent(dir));
            }
        }
    }
    this.home = function(){
        this.stack = [];
    }
    this.getPath = function () {
        if (this.stack.length == 0) return '';
        let path = [];
        for (let dir of this.stack) {
            path.push(encodeURIComponent(dir))
        }
        return "/" + path.join("/");
    }
    this.isRoot = function () {
        return this.stack.length == 0;
    }
}