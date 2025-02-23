/*
 *  Majiang.UI.GameCtl
 */
"use strict";

const { hide, show } = require('./fadein');

module.exports = class GameCtl {
    /**
     * 构造函数
     * @param {HTMLElement} root - 根节点
     * @param {string} storage - 存储名称
     * @param {Object} game - 游戏对象
     * @param {...Object} view - 视图对象
     */
    constructor(root, storage, game, ...view) {
        this._node = {
            controller: $('.controller', root),
            download:   $('.download', root),
        };
        this._game = game;
        this._view = view;

        this._storage = storage;
        this._pref = localStorage.getItem(storage)
                        ? JSON.parse(localStorage.getItem(storage))
                        : { sound_on: true, speed: 3 };

        if (game) game._view.no_player_name = true;
        this.redraw();
    }

    /**
     * 重绘控制器
     */
    redraw() {

        $('.speed span', this._node.controller).css('visibility','visible');

        this.sound(this._pref.sound_on);
        this.speed(this._pref.speed);

        this.set_handler();
    }

    /**
     * 设置游戏速度
     * @param {number} speed - 速度
     * @returns {boolean} - 返回false
     */
    speed(speed) {
        if (! this._game) return false;
        if (speed < 1) speed = 1;
        if (speed > 5) speed = 5;
        this._game.speed = speed;
        $('.speed span', this._root).each((i, n)=>{
            $(n).css('visibility', i < speed ? 'visible' : 'hidden');
        });
        this._pref.speed = speed;
        localStorage.setItem(this._storage, JSON.stringify(this._pref));
        return false;
    }

    /**
     * 设置声音
     * @param {boolean} on - 是否开启声音
     * @returns {boolean} - 返回false
     */
    sound(on) {
        this._view.forEach(v => v.sound_on = on);
        if (on) {
            hide($('.sound.off', this._node.controller));
            show($('.sound.on', this._node.controller));
        }
        else {
            hide($('.sound.on', this._node.controller));
            show($('.sound.off', this._node.controller));
        }
        this._pref.sound_on = on;
        localStorage.setItem(this._storage, JSON.stringify(this._pref));
        return false;
    }

    /**
     * 设置事件处理器
     */
    set_handler() {

        this.clear_handler();

        const ctl = this._node.controller;
        $('.sound', ctl).on('click', ()=>this.sound(! this._pref.sound_on));
        $('.minus', ctl).on('click', ()=>this.speed(this._game.speed - 1));
        $('.plus',  ctl).on('click', ()=>this.speed(this._game.speed + 1));

        $(window).on('keyup.controler', (ev)=>{
            if      (ev.key == 'a') this.sound(! this._pref.sound_on);
            else if (ev.key == '-') this.speed(this._game.speed - 1);
            else if (ev.key == '+') this.speed(this._game.speed + 1);
        });
    }

    /**
     * 清除事件处理器
     */
    clear_handler() {
        $('.sound, .minus, .plus', this._node.controller).off('click');
        $(window).off('.controler');
    }

    /**
     * 停止游戏
     */
    stop() {
        this._game.stop();
        let blob  = new Blob([ JSON.stringify(this._game._paipu) ],
                             { type: 'application/json' });
        $('a', this._node.download)
            .attr('href', URL.createObjectURL(blob))
            .attr('download', '牌譜.json');
        show(this._node.download);
        this.stoped = true;
    }

    /**
     * 开始游戏
     */
    start() {
        console.log('GameCtl start');
        this.stoped = false;
        hide(this._node.download);
        this._game.start();
    }

    /**
     * 显示手牌
     * @returns {boolean} - 返回false
     */
    shoupai() {
        const game = this._game;
        if (game._status == 'hule')   return true;
        if (game._status == 'pingju') return true;
        if (game._status == 'jieju')  return true;
        game._view.open_shoupai = ! game._view.open_shoupai;
        game._view.redraw();
        return false;
    }

    /**
     * 显示和牌
     * @returns {boolean} - 返回false
     */
    he() {
        const game = this._game;
        if (game._status == 'hule')   return true;
        if (game._status == 'pingju') return true;
        if (game._status == 'jieju')  return true;
        game._view.open_he = ! game._view.open_he;
        game._view.redraw();
        return false;
    }
}
