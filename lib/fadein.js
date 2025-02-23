/*
 *  fadein.js
 */
"use strict";

module.exports = {
    /**
     * 显示节点
     * @param {jQuery} node - jQuery对象
     */
    show: node => node.removeClass('hide fadeout'),

    /**
     * 隐藏节点
     * @param {jQuery} node - jQuery对象
     */
    hide: node => node.addClass('hide fadeout'),

    /**
     * 渐入显示节点
     * @param {jQuery} node - jQuery对象
     * @returns {jQuery} - 返回节点
     */
    fadeIn: node =>{
        node.addClass('hide fadeout');
        setTimeout(()=>{
            node.removeClass('hide');
            setTimeout(()=>
                    node.off('transitionend')
                        .removeClass('fadeout'), 20)
        }, 100);
        return node;
    },

    /**
     * 渐出隐藏节点
     * @param {jQuery} node - jQuery对象
     * @returns {jQuery} - 返回节点
     */
    fadeOut: node =>
        node.on('transitionend', ()=>
                    node.off('transitionend')
                        .addClass('hide'))
            .addClass('fadeout'),
}
