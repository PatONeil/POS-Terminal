/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posNotInMenuMgr = {
		type:				'',
		dialog:				null,
		$input:				null,
		lastInput:			[],
		init: 				function(menuItem) {
			var html = '';
			if (!menuItem) this.menuItem={product:'',price:0};
			else this.menuItem = menuItem;
			//  posTerminal is global varable
			html += this.setupSelection(menuItem);
			this.setupDialog(html);
		},
		destroy:			function() {
			this.dialog.dialog('destroy').remove();
		},
		setupSelection:function(menuItem) {
			var i,html = '';
			html += '<div id="posNotInMenuMgr" title="Add Unique Item to Order" style="">';
			html +=	' 	<h1 style="margin:2px;width:100%;text-align:center;">Add Unique Item To Order</h1>';
			html += '	<div style="float:left;margin:0px;padding:0px;width:100%;overflow:hidden;">';
			html += '		<div style="padding-left:10px;width:490px;float:left;">';
			html += '			<h3 style="margin-bottom:5px;">Description:';
			html += '				<div style="display:inline-block;">';
			html += '					<input id="nimiInput"   style="margin-left:10px;width:290px;" type="text" value="'+this.menuItem.product+'" />';
			html += '				</div>';
			html += '			</h3>';
			html += '			<div id="posKeyboard1" style="margin-top:5px;clear:both;float:left;display:inline-block;">';
			html += '			</div>';
			html += '		</div>';
			html += '		<div style="width:280px;float:left;">';
			html += '			<h3 style="margin-bottom:5px;"> Enter Amount:';
			html += '				<div style="display:inline-block;">';
			html += '					<input type="text"  id="vkTendered" ';
			html += '					style="border:2px solid lightblue;margin-left:10px;width:100px;text-align:right"';
			html += '			           value="'+this.menuItem.price+'" />';
			html += '				</div>';
			html += '			</h3>';
			html += '			<div id="posKeyboard2" style="clear:both;float:left;display:inline-block;">';
			html += '			</div>';
			html += '			<div style="padding-left:20px;padding-top:10px;float:left;">';
			html += '				<input style="border:2px solid lightblue;width:25px;height:25px;" type="checkbox" id="taxIncluded">Tax Included in Amount</input>';
			html += '			</div>';
			html += '		</div>';
			html += '	</div>';
			html += '	<div style="float:left;margin-top:10px;width:820px;height:50px;border-top:2px solid #5c9ccc;text-align:center;padding-top:5px;">';	
			html += '		<div class="actionButton" style="margin:4px;width:100px;height:24px;">';
			html += '			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			html += '				OK';
			html += '			</div>';
			html += '		</div>';
			html += '		<div class="actionButton" style="margin:4px;width:100px;height:24px;">';
			html += '			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			html += '				Cancel';
			html += '			</div>';
			html += '		</div>';
			html += '	</div>';
			html += '</div>';
			return html;
		},
		setupDialog:		function(html) {
			var self = this;
			$(html).dialog({
				modal: true,
				draggable: false,
				resizable: false,
				width: 838,
				dialogClass: '',
				position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
				open: function( event, ui ) {
					var tenderDialog=$(this);
					self.dialog = tenderDialog;
					tenderDialog.find('button').button()
							   .css('padding','0px');
					$('#posKeyboard1').posKeyboard({
						alwaysShow:true,
						keySet: 'normal',
						inputID:'nimiInput'
					});
					$('#posKeyboard2').posKeyboard({
						inputID:'vkTendered',
						keySet: 'normal',
						type: 'numeric',
						keys: {normal:['$20{50} 25&cent;{50} \t 1 2 3',
									  '$10{50} 10&cent;{50} \t 4 5 6',
									  '$5{50} 5&cent;{50} \t 9 8 7',
									  '$1{50} 1&cent;{50} \t 00 0 &#8656;']
							}
					});
				},
				close: function( event, ui ) {
					if (posTerminal.posMenuOrderMgr.order.mode == 'Edit') posTerminal.posMenuTicketMenuMgr.endEditMenuItem();
					$(this).dialog('destroy').remove();
				}
			});
			this.setupButtons();
			this.$input = $('#vkTendered');
		},
		setupButtons:		function() {
			var self = this;
			$('#posNotInMenuMgr .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case 'OK':
						var desc = $('#nimiInput').val();
						var price= ($('#vkTendered').val()+" ").replace(/[^\d.-]/g,'')||0;
						if (!desc) {
							alert ("Description must be provided");
							return;
						}
						if (!price || price==0) {
							alert ("Price must be provided");
							return;
						}
						if($("#taxIncluded").is(':checked')) 
							price = (parseFloat(price)/(1+parseFloat(posTerminal.options.tax.value))).toFixed(2);
						if (self.menuItem.price==0)
							posTerminal.posMenuTicketMgr.addNotInMenuItem(desc,price);
						else {
							self.menuItem.product=desc;
							self.menuItem.price = price;
							posTerminal.posMenuTicketMgr.refreshTicketDisplay();
						}
						self.dialog.dialog('close');
						break;
					case 'Cancel':
						self.dialog.dialog('close');
						break;
				}
			});
		},
		setupKeyboard:		function(keys) {
			var i,j,w,key,s='';
			s+='<div id="posCashTenderDialog" style="background-color:white;width:280px;padding-top:10px;">';
			s+='	<div style="height:50px;float left;">';
			s+='		<div id="vkTendered" ';
			s+='			class="ui-keyboard-button ui-state-default ui-corner-all"';
			s+='			style="margin-right:10px;float:right;width:115px;text-align:right;border:2px solid lightsteelblue;">';
			s+=                 this.menuItem.price;
			s+='		</div>';
			s+='	</div>';
			s+='	<div class="ui-keyboard-keyset ui-keyboard-keyset-normal" style="text-align:right;margin:10px;">';
			for (i in keys){
				for (j in keys[i]) {
					key =keys[i][j].toString();
					w=(key.indexOf("^")==-1)?false:true;
					if (w) key=key.replace('^','');
					w=true;  // just for this set...
					if (key=="\t") 	s+=this.setupKey('',w,false,true);
					else 			s+=this.setupKey(key,w,false,false);
				}
				s+='<br class="ui-keyboard-button-endrow">';
			}
			s+='<br class="ui-keyboard-button-endrow">';
			s+='	</div>';
			s+='</div>';
			return s;
		},
		setupKey:			function(key,wideKey,fullKey,spacer) {
			var s,w;
			if (spacer===true) {
				s='<span class="ui-keyboard-text ui-keyboard-spacer" style="width: 2em;"></span>';
				return s;
			}
			if (!wideKey) {
				wideKey='';
				w='';
			}
			else {
				wideKey='ui-keyboard-widekey';
				if (!fullKey) w= ' style="width:50px;" ';
				else		  w= ' style="text-align:right;width:115px;" ';
			}
			s ='<button role="button" type="button" aria-disabled="false" tabindex="-1" ';
			s+='	data-key="'+key+'" ';
			s+=		w;
			s+='	class="ui-keyboard-button '+wideKey+' ui-state-default ui-corner-all">';
			s+='	<span class="ui-keyboard-text">';
			s+=			key;
			s+='	</span>';
			s+='</button>';
			return s;
		},
		keyboardClicked:			function(e) {
			var self = e.data, $target = $(e.target);
			var value = self.$input.val(),pre,n, key = $target.text().trim();
			e.stopPropagation();
			if (key == '⌫') {
				n = self.lastInput.pop();
				self.$input.val(n);
				self.$input.html(n);
				return;
			}
			self.lastInput.push(value);
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
			self.$input.val(n.toFixed(2));
			self.$input.html(n.toFixed(2));
		}
	};
