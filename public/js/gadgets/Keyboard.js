(function($)
{
    Keyboard = Ratchet.Gadget.extend(
    {
        constructor: function(id, ratchet)
        {
            this.base(id ,ratchet);
        },

        setup: function()
        {
            this.get("/keyboard", this.index);
        },

        index: function(el)
        {
            var self = this;

            el.transform("templates/keyboard", function(el) {
                el.swap();

                self.setupKeyboard(el);
            });
        },

        setupKeyboard: function(el)
        {
            var self = this;

            var container = $("#keyboard");

            generateKeyboard(container);


        }
    });

    Ratchet.GadgetRegistry.register("page", Keyboard);

})(jQuery);


// keyboard creator

var layout = [
    ['1 2 3 4 5 6 7 8 9 0 - @ ` {bksp}',
        '! @ # $ % ^ & * ( ) _ + ~ {bksp}'],
    ['{tab} q w e r t y u i o p [ ] \\',
        '{tab} Q W E R T Y U I O P { } |'],
    ['{sp:.5} {caps} a s d f g h j k l ; \' {return}',
        '{sp:.5} {caps} A S D F G H J K L : " {return}'],
    ['{sp:1} {shift} z x c v b n m , . / {shift}',
        '{sp:1} {shift} Z X C V B N M < > ? {shift}' ],
    ['.com .net {space}  .org .edu', '.com .net {space} .org .edu']
];

var caps = false;


function generateKeyboard(container) {
    //console.log("Container is  " + container);
    keyBtn = jQuery('<div onpaste="captureFocus(1);"></div>')
        .attr('class','keyboardButton')
        .addClass('ui-keyboard-button')
        .addClass('ui-state-default');

    actionKey = keyBtn.clone()
        .addClass('ui-keyboard-actionkey');

    for( row in layout ){
        currentRow = layout[row];
        newRow = jQuery('<div></div>')
            .attr('id','ui-keyboard-row'+row)
            .addClass('ui-keyboard-row')
            .appendTo(container);

        for( set in currentRow ){
            newSet = jQuery('<div></div>')
                .addClass('ui-keyboard-keyset')
                .appendTo(newRow);
            shift = 0;
            if(set==1){
                newSet
                    .addClass('ui-keyboard-shiftset')
                    .hide();
                shift=1;
            }
            currentSet = currentRow[set];
            keys = currentSet.split(/\s+/);
            for( key in keys ){

                //if it's an action key
                if( /^{\S+}$/.test(keys[key])){

                    action = keys[key].match(/^{(\S+)}$/)[1];

                    if(action == 'space'){
                        actionKey.clone()
                            .attr('id','key_space')
                            .append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')
                            .css('width','660px')
                            .addClass('ui-keyboard-space')
                            .click(function(){
                                $("#"+previewInput).val(
                                    $("#"+previewInput).val() + ' ');
                            })
                            .appendTo(newSet);
                    }else if(action == 'bksp'){
                        actionKey.clone()
                            .attr('id','key_bksp')
                            .css('width','70px')
                            .append('Bksp')
                            .click(function(){
                                //console.log($("#"+previewInput).val());
                                $("#"+previewInput).val(
                                    $("#"+previewInput).val()
                                        .substring(0, $("#"+previewInput).val().length - 1)
                                );
                            })
                            .appendTo(newSet);
                    }else if(action == 'tab'){
                        actionKey.clone()
                            .attr('id','key_tab')
                            .css('width','70px')
                            .append('Tab')
                            .click(function(){
                                //console.log($("#"+previewInput).val());
                                $("#"+previewInput).val(
                                    $("#"+previewInput).val() + "     ");
                            })
                            .appendTo(newSet);

                    }else if(action == 'shift'){
                        actionKey.clone()
                            .attr('id','key_shift')
                            .append('Shift')
                            .css('width','130px')
                            .click(function(){
                                if (caps){
                                    hidden = $(container)
                                        .find('.ui-keyboard-keyset:hidden');
                                    visible = $(container)
                                        .find('.ui-keyboard-keyset:visible');
                                    console.log("lowercase");
                                    visible.hide();
                                    hidden.show();
                                    caps = false;
                                } else {
                                    hidden = $(container)
                                        .find('.ui-keyboard-keyset:hidden');
                                    visible = $(container)
                                        .find('.ui-keyboard-keyset:visible');
                                    console.log("allCaps");
                                    visible.hide();
                                    hidden.show();
                                    caps = true;
                                }
                            })
                            .appendTo(newSet);
                    }else if(action == 'caps'){
                        actionKey.clone()
                            .attr('id','key_caps')
                            .append('Caps')
                            .css('width','95px')
                            .click(function(){
                                hidden = $(container)
                                    .find('.ui-keyboard-keyset:hidden');
                                visible = $(container)
                                    .find('.ui-keyboard-keyset:visible');
                                visible.hide();
                                hidden.show();
                            })
                            .appendTo(newSet);
                    }else if(action == 'accept'){
                        actionKey.clone()
                            .attr('id','key_accept')
                            .append('Accept')
                            .css('width','60px')
                            .addClass('ui-state-highlight')
                            .removeClass('ui-state-active')
                            .click(function(){
                                ui.element.val(
                                    $("#"+previewInput).val()
                                );
                                $(container).hide();
                            })
                            .appendTo(newSet);
                    }else if(action == 'cancel'){
                        actionKey.clone()
                            .attr('id','key_cancel')
                            .append('Cancel')
                            .css('width','60px')
                            .addClass('ui-state-highlight')
                            .removeClass('ui-state-active')
                            .click(function(){
                                $(container).hide();
                            })
                            .appendTo(newSet);
                    }/*else if(/^sp:\.?\d+$/.test(action)){
                     margin = action.match(/^sp:(\.?\d+)$/)[1];
                     jQuery('<span>&nbsp;</span>')
                     .css('margin','0 ' + margin + 'em')
                     .appendTo(newSet);
                     }*/else if(action == "dec"){
                        keyBtn.clone()
                            .attr('id','key_decimal')
                            .append('.')
                            .appendTo(newSet);
                    }else if(action == "neg"){
                        actionKey.clone()
                            .attr('id','key_negative')
                            .append('+/-')
                            .css('width','60px')
                            .click(function(){
                                if(/^\-?\d*\.?\d*$/.test(
                                    $("#"+previewInput).val()
                                )){
                                    $("#"+previewInput).val(
                                        ($("#"+previewInput).val() * -1)
                                    );
                                }
                            })
                            .appendTo(newSet);
                    }else if(action == "return"){
                        actionKey.clone()
                            .attr('id','key_return')
                            .css('width','100px')
                            .append('Return')
                            .click(function(){
                                var pos = +($("#checkout").css('left')).replace('px','');
                                console.log(pos);
                                if (pos < 0){
                                    console.log("SEARCH BY RETURN");
                                    controller.set_category(null);
                                    controller.set_search(null);
                                    var search = $("#search").val();
                                    if(search == "null"){
                                        controller.set_search(null);
                                    } else {
                                        controller.set_search(search);
                                    }

                                    $("#navigation").animate({height:'100%',top:'0px'},500,function(){
                                        controller.display_view("ListView");
                                    });

                                    $("#search_overlay").fadeOut();
                                }else{
                                    console.log("Mwahaha your enter button is broked.");
                                }

                            })
                            .appendTo(newSet);
                    }
                }else{
                    //console.log(keys[key].toString());
                    keyBtn.clone()
                        .attr('id','key_'+row+'_'+key+'_'+shift)
                        .attr('onclick','void(0);')
                        .append(keys[key])
                        .click(function(){
                            console.log("clicked");
                            if (caps){
                                hidden = $(container)
                                    .find('.ui-keyboard-keyset:hidden');
                                visible = $(container)
                                    .find('.ui-keyboard-keyset:visible');
                                console.log("should be hiding caps");
                                visible.hide();
                                hidden.show();
                                caps = false;
                            }
                        })
                        .appendTo(newSet);
                    if (caps == true) {

                    }
                }
            }

        }

    }
}
