/*
 *  Majiang.UI.Analyzer
 */
"use strict";

const AI = require('@kobalab/majiang-ai');

const Shoupai = require('./shoupai');

const { show, hide } = require('./fadein');

/**
 * 分析器类，继承自AI
 */
module.exports = class Analyzer extends AI {
    /**
     * 构造函数
     * @param {HTMLElement} root - 根节点
     * @param {Object} kaiju - 开局信息
     * @param {Function} pai - 牌的回调函数
     * @param {Function} callback - 关闭回调函数
     */
    constructor(root, kaiju, pai, callback) {
        super();
        this._node = {
            root:      root,
            shoupai:   $('> .shoupai', root),
            dapai:     $('> .dapai',   root),
            r_shoupai: $('> .shoupai .row', root).eq(0),
            r_dapai:   $('> .dapai   .row', root).eq(0),
        };
        this._pai  = pai;
        this.close = callback;
        this.action(kaiju);
    }

    /**
     * 设置玩家ID
     * @param {string} id - 玩家ID
     */
    id(id) {
        this.action({ kaiju: {
            id:     id,
            rule:   this._rule,
            title:  this._model.title,
            player: this._model.player,
            qijia:  this._model.qijia,
        }})
    }

    /**
     * 处理下一步消息
     * @param {Object} msg - 消息对象
     */
    next(msg) {
        super.action(msg);
    }

    /**
     * 执行动作
     * @param {Object} msg - 消息对象
     */
    action(msg) {
        super.action(msg, ()=>{});
    }

    /**
     * 处理开局动作
     */
    action_kaiju() { this.clear() }

    /**
     * 处理起牌动作
     */
    action_qipai() {
        this.redraw_shoupai([]);
        this.active(true);
    }

    /**
     * 处理自摸动作
     * @param {Object} zimo - 自摸信息
     * @param {boolean} gangzimo - 是否杠自摸
     */
    action_zimo(zimo, gangzimo) {
        if (zimo.l != this._menfeng) {
            this.redraw_shoupai([]);
            return;
        }
        let info = [];
        if (this.select_hule(null, gangzimo, info)) {
            this.redraw_shoupai(info);
            this.active(true);
            return;
        }
        let m = this.select_gang(info);
        if (m) info.forEach(i=>{ if (i.m == m) i.selected = true });
        let p = this.select_dapai(info).slice(0,2);
        if (! m) info.forEach(i=>{ if (! i.m && i.p == p) i.selected = true });
        this.redraw_dapai(info);
    }

    /**
     * 处理打牌动作
     * @param {Object} dapai - 打牌信息
     */
    action_dapai(dapai) {
        if (dapai.l == this._menfeng) {
            this.update_dapai(dapai.p.slice(0,2));
            return;
        }
        let info = [];
        if (this.select_hule(dapai, null, info)) {
            this.redraw_shoupai(info);
            this.active(true);
            return;
        }
        let m = this.select_fulou(dapai, info);
        if (! m) m = '';
        info.forEach(i=>{ if (i.m == m) i.selected = true });
        this.redraw_shoupai(info);
    }

    /**
     * 处理副露动作
     * @param {Object} fulou - 副露信息
     */
    action_fulou(fulou) {
        if (fulou.l != this._menfeng) {
            this.redraw_shoupai([]);
            return;
        }
        if (fulou.m.match(/\d{4}/)) return;
        let info = [];
        let p = this.select_dapai(info).slice(0,2);
        info.forEach(i=>{ if (i.p == p) i.selected = true });
        this.redraw_dapai(info);
        this.active(true);
    }

    /**
     * 处理杠牌动作
     * @param {Object} gang - 杠牌信息
     */
    action_gang(gang) {
        if (gang.l == this._menfeng) {
            this.update_dapai(gang.m);
            return;
        }
        let info = [];
        if (this.select_hule(gang, true, info)) {
            this.redraw_shoupai(info);
            this.active(true);
            return;
        }
    }

    /**
     * 处理和了动作
     */
    action_hule()   { this.clear() }

    /**
     * 处理平局动作
     */
    action_pingju() { this.clear() }

    /**
     * 设置活动状态
     * @param {boolean} on - 是否激活
     */
    active(on) {
        if (on) this._node.root.addClass('active');
        else    this._node.root.removeClass('active');
    }

    /**
     * 清除状态
     */
    clear() {
        this.active(false)
        hide(this._node.shoupai);
        hide(this._node.dapai);
    }

    /**
     * 重绘手牌
     * @param {Array} info - 手牌信息数组
     */
    redraw_shoupai(info) {

        show(this._node.shoupai.empty());
        hide(this._node.dapai);

        if (! info.length) {
            let n_xiangting = Majiang.Util.xiangting(this.shoupai);
            let paishu = this._suanpai.paishu_all();
            let ev     = this.eval_shoupai(this.shoupai, paishu);
            let n_tingpai = Majiang.Util.tingpai(this.shoupai)
                                .map(p => this._suanpai._paishu[p[0]][p[1]])
                                .reduce((x, y)=> x + y, 0);
            info.push({
                m: '', n_xiangting: n_xiangting, n_tingpai: n_tingpai,
                ev: ev, shoupai: this.shoupai.toString(),
            });
        }

        const cmp = (a, b)=> a.selected ? -1
                           : b.selected ?  1
                           : b.ev - a.ev;
        for (let i of info.sort(cmp)) {
            let row = this._node.r_shoupai.clone();
            $('.xiangting', row).text(  i.n_xiangting <  0 ? '和了形'
                                      : i.n_xiangting == 0 ? '聴牌'
                                      : `${i.n_xiangting}向聴`);
            if (i.ev == null) {
                $('.eval', row).text('');
            }
            else if (i.n_xiangting > 2) {
                let x = i.ev - i.n_tingpai;
                $('.eval', row).text(x ? `${i.n_tingpai}(+${x})枚`
                                       : `${i.n_tingpai}枚`);
            }
            else {
                $('.eval', row).text(i.ev.toFixed(2));
            }
            new Shoupai($('.shoupai', row), this._pai,
                        Majiang.Shoupai.fromString(i.shoupai)).redraw(true);
            let action = i.n_xiangting < 0                      ? '和了'
                       : ! i.m                                  ? ''
                       : i.m.match(/\d{4}/)                     ? 'カン'
                       : i.m.replace(/0/,'5').match(/(\d)\1\1/) ? 'ポン'
                       :                                          'チー';
            $('.action', row).text(action);

            this._node.shoupai.append(row);
        }

        if (info.length == 1) this.active(false);
        else                  this.active(true);
    }

    /**
     * 重绘打牌
     * @param {Array} info - 打牌信息数组
     */
    redraw_dapai(info) {

        hide(this._node.shoupai);
        if (info.length) show(this._node.dapai.empty());
        else             hide(this._node.dapai);

        const cmp = (a, b)=> a.selected ? -1
                           : b.selected ?  1
                           : b.ev - a.ev;
        for (let i of info.sort(cmp)) {
            let row = this._node.r_dapai.clone().removeClass('selected')
                                                .attr('data-dapai', i.m || i.p);
            $('.p', row).empty().append(this._pai(i.p));
            if (i.m) $('.p', row).append($('<span>').text('カン'));
            $('.xiangting', row).text(i.n_xiangting ? `${i.n_xiangting}向聴`
                                                    : '聴牌');
            if (i.ev == null) {
                $('.eval', row).text('オリ');
            }
            else if (i.n_xiangting > 2) {
                let x = i.ev > i.n_tingpai ? i.ev - i.n_tingpai : 0;
                $('.eval', row).text(x ? `${i.n_tingpai}(+${x})枚`
                                       : `${i.n_tingpai}枚`);
            }
            else {
                $('.eval', row).text(i.ev.toFixed(2));
            }
            $('.tingpai', row).empty();
            for (let p of i.tingpai || []) {
                $('.tingpai', row).append(this._pai(p));
            }
            if (i.n_xiangting <= 2 && i.ev != null) {
                $('.tingpai', row)
                    .append($('<span>').text(`(${i.n_tingpai}枚)`));
            }
            let weixian = i.weixian == null ? ''
                        : i.weixian >= 13.5 ? 'high'
                        : i.weixian >=  8.0 ? 'middle'
                        : i.weixian >=  3.0 ? 'low'
                        : i.weixian ==  0.0 ? 'none'
                        :                     '';
            $('.eval', row).removeClass('high middle low none')
                           .addClass(weixian);

            this._node.dapai.append(row);
        }

        if (this.shoupai.lizhi && info.length == 1) this.active(false);
        else                                        this.active(true);
    }

    /**
     * 更新打牌状态
     * @param {string} p - 打牌字符串
     */
    update_dapai(p) {
        $(`.row[data-dapai="${p}"]`, this._node.dapai).addClass('selected');
    }
}
