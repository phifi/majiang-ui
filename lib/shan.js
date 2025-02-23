/*
 *  Majiang.UI.Shan
 */
"use strict";

module.exports = class Shan {
    /**
     * 创建一个 Shan 实例
     * @param {HTMLElement} root - 根元素
     * @param {Function} pai - 牌的生成函数
     * @param {Object} shan - 山的对象
     */
    constructor(root, pai, shan) {
        console.log('ui.Shan.constructor', shan);
        this._node = {
            baopai:   $('.baopai',   root),
            fubaopai: $('.fubaopai', root),
            paishu:   $('.paishu',   root)
        };
        this._pai  = pai;
        this._shan = shan;
    }

    /**
     * 重新绘制山的显示
     * @returns {Shan} 当前实例
     */
    redraw() {
        let baopai = this._shan.baopai;
        this._node.baopai.attr('aria-label', 'ドラ');
        this._node.baopai.empty();
        for (let i = 0; i < 5; i++) {
            this._node.baopai.append(this._pai(baopai[i] || '_'));
        }

        let fubaopai = this._shan.fubaopai || [];
        this._node.fubaopai.attr('aria-label', '裏ドラ');
        this._node.fubaopai.empty();
        for (let i = 0; i < 5; i++) {
            this._node.fubaopai.append(this._pai(fubaopai[i] || '_'));
        }

        this._node.paishu.text(this._shan.paishu);

        return this;
    }

    /**
     * 更新山的牌数显示
     * @returns {Shan} 当前实例
     */
    update() {
        this._node.paishu.text(this._shan.paishu);
        return this;
    }
}
