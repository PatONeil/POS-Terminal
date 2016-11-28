/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
(function( $ ){

  var methods = {
	defaults:{
		keys: {
			'normal': [
				'q w e r t y u i o p &#8656;',
				'a s d f g h j k l return',
				'&#8657{,shift}; z x c v b n m &#44; . &#8657;{,shift}',
				'.?123{,meta1} &nbsp;{200} .?123{,meta1}'
			],
			'shift': [
				'Q W E R T Y U I O P &#8656;',
				'A S D F G H J K L return',
				'&#8659;{,normal} Z X C V B N M ! ? &#8659;{,normal}',
				'.?123{,meta1} &nbsp;{200} .?123{,meta1}'
			],
			'meta1': [
				'1 2 3 4 5 6 7 8 9 0 &#8656;',
				'- / : ; ( ) \u20ac & @ return',
				'#+={,meta2} . &#44; ? ! \' " #+={,meta2}',
				'ABC{,normal} &nbsp;{200} ABC{,normal}'
			],
			'meta2': [
				'[ ] &#123; &#125; # % ^ * + = &#8656;',
				'_ \\ | ~ < > $ \u00a3 \u00a5 return',
				'.?123{,meta1} . &#44; ? ! \' " .?123{,meta1}',
				'ABC{,normal} &nbsp;{200} ABC{,normal}'
			]
		},
		keySet: '',
		inputID: '',
		alwaysShow:true,
		type: 'alpha',
		accepted: function(){},
		cancel: function(){}
	},
	options: {},
	currentSet: '',
	lastInput:[],
	init:function(options) {
		var self=this;
		this.container=this;
		$.extend(true,this,methods);
		this.options =  $.extend( {}, this.defaults, options );
		this.lastInput = [];
		this.currentSet=this.options.keySet;
		this.setupKeyboard(); 
		if (!this.options.alwaysShow) $('#'+this.options.inputID).on('click',self,self.showOnClick);
		if (/ipod|iphone|ipad|android|nexus|tizen|windows phone|tablet/i.test(navigator.userAgent)) {
			// set input to readonly to avoid mobile keyboard.
			$('#'+this.options.inputID).attr('readonly','readonly');
		}
	},
	destroy:function () {
	},
	showOnClick:function(e){
		var self=e.data;
		e.stopPropagation();
		$('#'+self.container.attr('id')+'_keys')
			.show()
			.css({'display':'inline-block','z-index':200+$('.ui-keyboard-keyset').length})
			.on('click',function(e){e.stopPropagation();});
		$('#posTerminal').on('click.posKeyboard',self,self.hideOnClick);
		// need to set up onmousedown to hide again...
	},
	hideOnClick:  function(e) {
		var self = e.data;
		$('#posTerminal').off('click.posKeyboard');
		$('#'+self.container.attr('id')+'_keys').hide();
	},	
	setupKeyboard:function() {
		var i,j,w,set,key,keyset,s='',self=this;
		var styles="z-index:200;text-align:center;display:inline-block;border:1px solid #5c9ccc; background-color:white;padding:5px;";
		if (!this.options.alwaysShow) styles+='display:none;';
		s+='<div id="'+this.container.attr('id')+'_keys" style="'+styles+'">';
		s+='	<div class="ui-keyboard-keyset ui-keyboard-keyset-normal" style="">';
		for (i in this.options.keys[this.currentSet]){
			lineKeys = this.options.keys[this.currentSet][i].split(' ');
			for (j in lineKeys) {
				parms = lineKeys[j].split(/[\{\,\}]/);
				key =parms[0];
				w = parms[1]?parms[1]:'';
				set = parms[2]?parms[2]:'';
				s+=this.setupKey(key,w,set);
			}
			s+='<br class="ui-keyboard-button-endrow">';
		}
		s+='	</div>';
		s+='</div>';
		this.container.children().remove();
		this.container.html(s)
			.find('button').on('click',self,function(e) {
					var key=$.trim($(e.target).text())||' ';
					var keyset= $(e.currentTarget).data('set');
					if (keyset) {
						self.switchKeyboard(keyset);
						return;
					}
				    if (key.toLowerCase()=='accept') {
						self.options.accepted();
						return;
					}
				    if (key.toLowerCase()=='cancel' || key.charCodeAt(0)==9746) {
						self.options.cancel();
						return;
					}
					if (self.options.type=='numeric') 	self.numericInput(key);
					else 							  	self.alphaInput(key);
			   });
		return ;
	},
	switchKeyboard:function(keySet) {
		this.currentSet= keySet;
		this.setupKeyboard();
	},
	numericInput:function(key) {
		var input = $('#'+this.options.inputID);
		var value = input.val();
		if (key.charCodeAt(0)==8656) {
			n = this.lastInput.pop();
			input.val(n);
			return;
		}
		this.lastInput.push(value);
		if (/\$|\¢/.test(key)==false) {
				pre = value.toString().replace('.','').replace('$','')+key;
				n   = parseFloat(pre)/100; //
		}
		else {
			pre = '0'+value.toString().replace('.','').replace('$','');
			if (key.indexOf('$')!=-1) {
				n=parseFloat(pre)/100 + parseFloat(key.replace('$',''));
			}
			else if (key.indexOf('¢')!=-1) {
				n=parseFloat(pre)/100 + parseFloat(key.replace('¢',''))/100;
			}
		}
		input.val(n.toFixed(2));
	},
	alphaInput:  function(key) {	
		var input = $('#'+this.options.inputID);
		var value = input.val();
		if (key=='return') {
			key='';
			if (input.attr('nodeName')=="textarea") key="\n";
		}
		if (key.charCodeAt(0)==8656) {
			input.val(value.substr(0,value.length-1));
		}
		else input.val(value+key);
	},
	setupKey:function(key,width,set) {
		var s,w='';
		if (key=="\t") {
			w=width?width+"px;":"2em;";
			s='<span class="ui-keyboard-text ui-keyboard-spacer" style="width: '+w+'"></span>';
			return s;
		}
		if (width) {
			w = ' style="width:'+width+'px;" ';
		}
		s ='<button data-set="'+set+'" data-inputID="'+this.options.inputID+'"';
		s+='		data-type="'+this.options.type+'" data-key="'+key+'" ';
		s+='		role="button" type="button" aria-disabled="false" tabindex="-1" ';
		s+=			w;
		s+='		class="ui-keyboard-button  ui-state-default ui-corner-all">';
		s+='	<span class="ui-keyboard-text">';
		s+=			key;
		s+='	</span>';
		s+='</button>';
		return s;
	}
	
};

$.fn.posKeyboard = function( method ) {
    
    // Method calling logic
    if ( methods[method] ) {
      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.posKeyboard' );
    }    
  
};

})( jQuery );