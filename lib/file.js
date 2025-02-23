/*
 *  Majiang.UI.PaipuFile
 */
"use strict";

const $ = require('jquery');
require('jquery-ui/ui/widgets/sortable');

const { hide, show, fadeIn, fadeOut } = require('./fadein');

/**
 * 修复牌谱
 * @param {Object} paipu - 牌谱对象
 * @returns {Object} - 修复后的牌谱对象
 */
function fix(paipu) {
    const keys = ['title','player','qijia','log','defen','rank','point'];
    for (let p of [].concat(paipu)) {
        for (let key of keys) {
            if (p[key] == undefined) throw new Error(`${key}: undefined`);
        }
    }
    return paipu;
}

/**
 * 初始化牌谱
 * @returns {Object} - 初始化后的牌谱对象
 */
function init_paipu() {
    return {
        title:  '(対局名)',
        player: ['(東家)','(南家)','(西家)','(北家)'],
        qijia:  0,
        log:    [],
        defen:  [],
        rank:   [],
        point:  []
    };
}

class PaipuStorage {

    /**
     * 构造函数
     * @param {string} name - 存储名称
     */
    constructor(name) {
        this._paipu = [];
        this._name  = name;
        try {
            if (name) {
                this._paipu = fix(JSON.parse(
                                    localStorage.getItem(name) || '[]'));
            }
        }
        catch(e) {
            console.log(e);
        }
    }

    /**
     * 获取牌谱长度
     * @returns {number} - 牌谱长度
     */
    get length() {
        return this._paipu.length;
    }

    /**
     * 将牌谱转换为字符串
     * @param {number} [idx] - 索引
     * @returns {string} - 牌谱字符串
     */
    stringify(idx) {
        return JSON.stringify(idx == null ? this._paipu : this._paipu[idx]);
    }

    /**
     * 保存牌谱
     */
    save() {
        if (! this._name) return;
        try {
            localStorage.setItem(this._name, this.stringify());
        }
        catch(e) {
            this._paipu = fix(JSON.parse(
                                localStorage.getItem(this._name) || '[]'));
            throw e;
        }
    }

    /**
     * 添加牌谱
     * @param {Object} paipu - 牌谱对象
     * @param {boolean} [save=true] - 是否保存
     */
    add(paipu, save = true) {
        this._paipu = this._paipu.concat(fix(paipu));
        if (save) this.save();
    }

    /**
     * 删除牌谱
     * @param {number} idx - 索引
     */
    del(idx) {
        this._paipu.splice(idx, 1);
        this.save();
    }

    /**
     * 获取牌谱
     * @param {number} [idx] - 索引
     * @returns {Object} - 牌谱对象
     */
    get(idx) {
        if (idx == null) return this._paipu;
        else             return this._paipu[idx];
    }

    /**
     * 排序牌谱
     * @param {Array<number>} sort - 排序数组
     */
    sort(sort) {
        let tmp = this._paipu.concat();
        for (let i = 0; i < this.length; i++) {
            this._paipu[i] = tmp[sort[i]];
        }
        this.save();
    }
}

/**
 * 处理HTTP错误
 * @param {Response} res - 响应对象
 * @returns {string} - 错误信息
 */
function http_error(res) {
    const statusText = {
        '400':  'Bad Request',
        '401':  'Unauthorized',
        '402':  'Payment Required',
        '403':  'Forbidden',
        '404':  'Not Found',
        '405':  'Method Not Allowed',
        '406':  'Not Acceptable',
        '407':  'Proxy Authentication Required',
        '408':  'Request Timeout',
        '409':  'Conflict',
        '410':  'Gone',
        '411':  'Length Required',
        '412':  'Precondition Failed',
        '413':  'Request Entity Too Large',
        '414':  'Request-URI Too Long',
        '415':  'Unsupported Media Type',
        '416':  'Requested Range Not Satisfiable',
        '417':  'Expectation Failed',
        '500':  'Internal Server Error',
        '501':  'Not Implemented',
        '502':  'Bad Gateway',
        '503':  'Service Unavailable',
        '504':  'Gateway Timeout',
        '505':  'HTTP Version Not Supported',
    };
    return res.statusText ? `${res.status} ${res.statusText}`
                          : `${res.status} ${statusText[res.status]}`;
}

module.exports = class PaipuFile {

    /**
     * 构造函数
     * @param {HTMLElement} root - 根节点
     * @param {string} storage - 存储名称
     * @param {Function} viewer - 查看器函数
     * @param {Function} stat - 统计函数
     * @param {Function} editor - 编辑器函数
     * @param {string} tenhou - 天凤URL
     * @param {string} url - URL
     * @param {string} hash - 哈希
     */
    constructor(root, storage, viewer, stat, editor, tenhou, url, hash) {
        this._root    = root;
        this._row     = $('.row', root);
        this._storage = storage;
        this._paipu   = new PaipuStorage(storage);
        this._max_idx = 0;

        this.open_viewer = viewer;
        this.goto_stat   = stat;
        this.open_editor = editor;

        if (tenhou) {
            let base   = location.href.replace(/\?.*$/,'')
                                      .replace(/[^\/]*$/,'');
            let otigin = location.origin;
            if (tenhou.slice(0, base.length) == base) {
                this._tenhou = tenhou.slice(base.length);
            }
            else if (tenhou.slice(0, origin.length) == origin) {
                this._tenhou = tenhou.slice(origin.length);
            }
            else {
                this._tenhou = tenhou;
            }
        }

        $('input[name="storage"]', root).prop('checked', true);

        $('.upload input', root).on('change', (ev)=>{
            for (let file of ev.target.files) {
                this.read_paipu(file);
            }
            $(ev.target).val(null);
        });
        $('input[name="storage"]', root).on('change', (ev)=>{
            this.storage($(ev.target).prop('checked'));
            fadeIn($('body'));
        });
        $('.stat', root).on('click', ()=>{
            if (this._url) history.replaceState('', '', '#stat');
            this.goto_stat(this._paipu.get());
        });
        $('.file > .button .edit', root).on('click', ()=>{
            let paipu = init_paipu();
            this._paipu.add(paipu, false);
            this.open_editor(paipu, ()=>this._paipu.save());
        });
        $('.error', root).on('click', ()=>fadeOut($('.error', root)));
        $('form.tenhou', this._root).on('submit', (ev)=>{
            let url = $('input[name="url"]', $(ev.target)).val();
            let hash = url.match(/#.*$/) || '';
            if (! hash) {
                let params = '' + (url.match(/\&.*$/)||'');
                let tw = (params.match(/\&tw=(\d+)/)||[])[1] ||'';
                let ts = (params.match(/\&ts=(\d+)/)||[])[1] ||'';
                let tj = (params.match(/\&tj=(\d+)/)||[])[1] ||'';
                if (params) {
                    hash = `#/${tw}/${ts}/${tj}`;
                }
            }
            let id = url.replace(/^.*\?log=/,'')
                        .replace(/\&.*$/,'')
                        .replace(/#.*$/, '')
                        .replace(/^.*\//,'')
                        .replace(/\..*$/,'');
            location = '?' + this._tenhou + id + '.json' + hash;
            return false;
        });

        if (url) this.load_paipu(url, hash);
        else if (this.isEmpty)
                $('input[name="storage"]', root).trigger('click');
    }

    /**
     * 设置存储
     * @param {boolean} on - 是否开启存储
     */
    storage(on) {
        if (on) {
            delete this._url;
            history.replaceState('', '', location.pathname);
        }
        this._paipu = new PaipuStorage(on ? this._storage : null);
        $('input[name="storage"]', this._root).prop('checked', on);
        this.redraw();
    }

    /**
     * 判断是否为空
     * @returns {boolean} - 是否为空
     */
    get isEmpty() { return ! this._paipu.length }

    /**
     * 添加牌谱
     * @param {Object} paipu - 牌谱对象
     * @param {number} truncate - 截断长度
     */
    add(paipu, truncate) {
        delete this._url;
        this._paipu.add(paipu);
        while (truncate, this._paipu.length > truncate) this._paipu.del(0);
    }

    /**
     * 读取牌谱文件
     * @param {File} file - 文件对象
     */
    read_paipu(file) {

        if (! file.type.match(/^application\/json$/i)
            && ! file.name.match(/\.json$/i))
        {
            this.error(`${file.name}: 不正なファイルです`);
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev)=>{
            try {
                let paipu = JSON.parse(ev.target.result);
                this.add(paipu);
            }
            catch(e) {
                if (e instanceof DOMException)
                        this.error('ローカルストレージ容量オーバー');
                else    this.error(`${file.name}: 牌譜形式が不正です`);

            }
            this.redraw();
        };
        reader.readAsText(file);
    }

    /**
     * 加载牌谱
     * @param {string} url - URL
     * @param {string} hash - 哈希
     */
    load_paipu(url, hash) {

        this.storage(false);
        fadeIn($('.loading', this._root));

        fetch(url)
            .then(res =>{
                if (! res.ok) {
                    this.error(`${decodeURI(url)}: ${http_error(res)}`);
                    throw new Error();
                }
                return res.json();
            })
            .then(data =>{
                setTimeout(()=> hide($('.loading', this._root)), 100);
                this.add(data);
                this.redraw();
                this._url = url;
                if (hash) this.open(hash);
            })
            .catch(e =>{
                setTimeout(()=> hide($('.loading', this._root)), 100);
                if (e instanceof TypeError)
                    this.error(`${decodeURI(url)}: ${e.message}`);
                else if (e.message)
                    this.error(`${decodeURI(url)}: 牌譜形式が不正です`);
            });
    }

    /**
     * 重绘牌谱文件
     */
    redraw() {

        let list = $('.list', this._root).empty();
        for (let i = 0; i < this._paipu.length; i++) {
            let paipu = this._paipu.get(i);
            let player = [];
            if (! paipu.rank.length) {
                for (let l = 0; l < 4; l ++) {
                    let id = (paipu.qijia + l) % 4;
                    paipu.rank[id] = l + 1;
                }
            }
            for (let l = 0; l < 4; l++) {
                let point = (paipu.point[l] > 0 ? '+' : '')
                                    + (paipu.point[l] ?? '−');
                player[paipu.rank[l] - 1] = `${paipu.player[l]} (${point})`;
            }

            let row = this._row.clone();
            row.attr('data-idx', i);
            $('.title', row).text(paipu.title);
            $('.player', row).text(player.join(' / '));
            list.append(hide(row));
            if (i < this._max_idx) show(row);
        }
        this._max_idx = this._paipu.length;

        if ($('input[name="storage"]', this._root).prop('checked'))
                show($('.file .edit'), this._root);
        else    hide($('.file .edit'), this._root);

        if (this.isEmpty) {
            hide($('.file > .button .stat',     this._root));
            hide($('.file > .button .download', this._root));
            if ($('input[name="storage"]', this._root).prop('checked'))
                    hide($('form.tenhou', this._root));
            else if (this._tenhou)
                    show($('form.tenhou', this._root));
        }
        else {
            show($('.file > .button .stat',     this._root));
            show($('.file > .button .download', this._root));
            hide($('form.tenhou', this._root));
        }


        this.set_handler();

        $('.list', this._node).sortable({
            opacity:     0.7,
            cursor:      'move',
            axis:        'y',
            containment: 'parent',
            tolerance:   'pointer',
            handle:      '.move',
            update:      (ev, ui)=>{
                delete this._url;
                let sort = $.makeArray($(ev.target).children().map(
                                (i, row)=>$(row).data('idx')));
                this._paipu.sort(sort);
                this.redraw();
            }
        });
        if (navigator.maxTouchPoints) hide($('.move, .edit', this._node));

        show($('.file', this._root));
        fadeIn($('.row.hide'), this._root);
    }

    /**
     * 设置事件处理器
     */
    set_handler() {

        if (this.isEmpty) return;

        let row = $('.row', this._root);
        for (let i = 0; i < this._paipu.length; i++) {

            $('.replay', row.eq(i)).on('click', ()=>{
                const viewer = this.open_viewer(this._paipu.get(i));
                if (this._url) viewer.set_fragment(`#${i||''}`);
                viewer.start();
            });

            $('.edit', row.eq(i)).on('click', ()=>{
                this.open_editor(this._paipu.get(i), ()=>this._paipu.save());
            });

            $('.delete', row.eq(i)).on('click', ()=>{
                delete this._url;
                this._paipu.del(i);
                this.redraw();
            });

            let title = this._paipu.get(i).title.replace(/[\s\n\\\/\:]/g, '_');
            let blob  = new Blob([ this._paipu.stringify(i) ],
                                 { type: 'application/json' });
            $('.download', row.eq(i))
                        .attr('href', URL.createObjectURL(blob))
                        .attr('download', `牌譜(${title}).json`);
        }

        let title = this._paipu.get(0).title.replace(/[\s\n\\\/\:]/g, '_');
        let blob  = new Blob([ this._paipu.stringify() ],
                             { type: 'application/json' });
        $('.file > .button .download', this._root)
                    .attr('href', URL.createObjectURL(blob))
                    .attr('download', `牌譜(${title}).json`);
    }

    /**
     * 打开牌谱
     * @param {string} hash - 哈希
     */
    open(hash) {

        if (hash == 'stat') {
            this.goto_stat(this._paipu.get());
        }
        else if (hash) {
            let [ state, opt ] = hash.split(':');
            state = state.split('/').map(x => isNaN(x) ? 0 : +x|0);
            let i = state.shift();
            if (i >= this._paipu.length) return;
            const viewer = this.open_viewer(this._paipu.get(i))
            viewer.set_fragment('#' + hash);
            viewer.start(...state);
            if (opt) {
                if (opt.match(/s/)) viewer.shoupai();
                if (opt.match(/h/)) viewer.he();
                if (opt.match(/i/)) viewer.analyzer();
                for (let x of opt.match(/\+/g)||[]) {
                    if (viewer._deny_repeat) break;
                    viewer.next();
                }
            }
        }
    }

    /**
     * 显示错误信息
     * @param {string} msg - 错误信息
     */
    error(msg) {
        const error = $('.error', this._root).text(msg);
        fadeIn(error);
        setTimeout(()=>error.trigger('click'), 5000);
    }
}
