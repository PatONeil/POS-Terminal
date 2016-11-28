/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posCashTender = {
		returnFcn:			null,
		caption:			'',
		payAmount:			0,
		context:			null,
		type:				'cash',
		dialog:				null,
		$input:				null,
		lastInput:			[],
		init: 				function(_type,_caption, _payAmount, _context, _returnFcn) {
			//  posTerminal is global varable
			this.type	 	= _type;
			this.caption 	= _caption;
			this.returnFcn 	= _returnFcn;
			this.payAmount	= _payAmount;
			this.context	= _context;
			this.width=300;
//			if (this.type=='cash') 	this.width=300;
//			else			  		this.width=255;
			//this.setupActionKeys();
			this.setupDialog();
		},
		destroy:			function() {
			this.dialog.dialog('destroy').remove();
		},
		setupDialog:		function() {
			var html=this.setupHTML(),self = this;
			$(html).dialog({
				modal: true,
				draggable: true,
				resizable: false,
				position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
				width: this.width,
				dialogClass: '',
				open: function( event, ui ) {
					var amt,tenderDialog=$(this);
					var keys= {cash:['$20{50} 25&cent;{50} \t 1 2 3',
									  '$10{50} 10&cent;{50} \t 4 5 6',
									  '$5{50} 5&cent;{50} \t 9 8 7',
									  '$1{50} 1&cent;{50} \t 00 0 &#8656;'] 
							}
					if (parseFloat(self.payAmount)) {
						amt = '$'+parseFloat(self.payAmount.toString().replace('$','')).toFixed(2)
						keys.cash.push('\t{145} '+amt+'{115}')
					}
					self.dialog = tenderDialog;
					$('#posKeyboard').posKeyboard({
						inputID:'vkTendered',
						keySet: 'cash',
						type: 'numeric',
						keys: keys
					});
				},
				close: function( event, ui ) {
					$(this).dialog('destroy').remove();
				}
			});
			this.setupButtons();
			this.$input = $('#vkTendered');
		},
		setupButtons:		function() {
			var self = this;
			$('#posCashTenderDialog .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				var amt = $('#vkTendered').val().replace('$','')
				switch (button) {
					case 'OK':
						self.dialog.dialog('close');
						self.returnFcn.call(self.context,amt);
						break;
					case 'Cancel':
						self.dialog.dialog('close');
						break;
				}
			});
		},
		setupHTML:		function() {
		var i,j,w,key,s='';
			s+='<div id="posCashTenderDialog" title="'+this.caption+'" style="background-color:white;border:1px solid grey;width:'+this.width+'px;height:204px;padding:10px;">';
			s+='	<div style="float:right;">';
			s+='		<input type="text"  id="vkTendered" ';
			s+='		style="border:2px solid lightblue;margin-left:10px;margin-bottom:10px;width:100px;text-align:right"';
			s+='          value="" />';
			s+='	</div>';
			s+='	<div id="posKeyboard" style="clear:both;float:right;display:inline-block;">';
			s+='	</div>';
			s+='	<div style="float:left;margin-top:10px;width:100%;height:50px;border-top:2px solid #5c9ccc;text-align:center;padding-top:5px;">';	
			s+='		<div class="actionButton" style="margin:4px;width:100px;height:24px;">';
			s+='			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			s+='				OK';
			s+='			</div>';
			s+='		</div>';
			s+='		<div class="actionButton" style="margin:4px;width:100px;height:24px;">';
			s+='			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			s+='				Cancel';
			s+='			</div>';
			s+='		</div>';
			s+='	</div>';
			s+='</div>';
			return s;
		}
	};
