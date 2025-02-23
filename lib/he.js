/*
 *  Majiang.UI.He
 */
"use strict";

const $ = require('jquery');

module.exports = class He {
    /**
     * 构造函数
     * @param {HTMLElement} root - 根节点
     * @param {Function} pai - 牌函数
     * @param {Object} he - 和牌对象
     * @param {boolean} open - 是否打开
     */
    constructor(root, pai, he, open) {
        console.log('ui.He.constructor', he, open);
        this._node = {
            root:   root,
            chouma: $('.chouma', root),
            dapai:  $('.dapai',  root)
        };
        this._pai  = pai;
        this._he   = he;
        this._open = open;
        this._node.chouma.addClass('hide');
    }

    /**
     * 重绘和牌
     * @param {boolean} [open] - 是否打开
     * @returns {He} - 返回当前实例
     */
    redraw(open) {
        if (open != null) this._open = open;

        this._node.root.attr('aria-label', '捨て牌');
        this._node.chouma.attr('aria-label', 'リーチ');
        this._node.dapai.empty();
        let lizhi = false;
        let i = 0;
        for (let p of this._he._pai) {
            if (p.match(/\*/)) {
                lizhi = true;
                this._node.chouma.removeClass('hide');
            }
            if (p.match(/[\+\=\-]/)) continue;

            let pai = this._pai(p);
            if (this._open && p[2] == '_') {
                pai.addClass('mopai');
            }
            if (lizhi) {
                pai = $('<span class="lizhi">').attr('aria-label', 'リーチ')
                                               .append(pai);
                lizhi = false;
            }
            this._node.dapai.append(pai);

            i++;
            if (i < 6 * 3 && i % 6 == 0) {
                this._node.dapai.append($('<span class="break">'));
            }
        }
        return this;
    }

    /**
     * 打牌
     * @param {string} p - 牌
     * @returns {He} - 返回当前实例
     */
    dapai(p) {
        let pai = this._pai(p).addClass('dapai').attr('aria-live','assertive');
        if (p[2] == '_') pai.addClass('mopai');
        if (p.match(/\*/)) pai = $('<span class="lizhi">').append(pai);
        this._node.dapai.append(pai);
        return this;
    }
}
