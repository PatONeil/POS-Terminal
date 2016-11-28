/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posDiscountMgr = {
		order:				null,
		dialog:				null,
		selectedDiscount:	'',
		discountList:		{
			'Employee': {description:'Employee 10% discount',
						 mgrApproval:false,
						 type:'item',
						 rtn:function(order,itemAmount) {
							 return itemAmount*0.10;
						 }
			},
			'FreeLunch':{description:'Lunch Entree for Two',
						 mgrApproval:false,
						 type:'item',
						 rtn:function(order,itemAmount) {
							 return itemAmount;
						 }
			},
			'FreeBreakfast':{description:'Breakfast Entree for Two',
							 mgrApproval:false,
							 type:'item',
							 rtn:function(order,itemAmount) {
								return itemAmount;
						 }
			},
			'AdjustTotal':{ description:'Manager Total Adjustment',
							mgrApproval:true,
							type:'order',
							rtn:function(order,itemAmount) {
								var self = posTerminal.posDiscountMgr;
								var order = self.order;
								if (!order.discountParm) {
									posTerminal.pageLoader(
										{scripts:[
													['js/posCashTender.js','posCashTender',['cash','Discount Amount',0,self,function(amt){
														var num = parseFloat((" "+amt).trim().replace('$',''));
														if (order.subtotal - num/1.0635 < 0) {
															alert('Discount greater than subtotal is not allowed');
															return;
														}
														if (posTerminal.employees[order.employeeID].type!='manager') {
															posTerminal.posVerifyMgrApproval(self, function(employee){
																self.order.discountParm = num/order.total;
																for (i in self.order.menuItems) {
																	self.order.menuItems[i].discountID='AdjustTotalItem';
																	self.order.menuItems[i].discountItemSelected=true;
																}
																self.recalculateDiscount();
															});
														}
														else {
															self.clearDiscounts();
															order.discountParm = num/order.total;
															for (i in self.order.menuItems) {
																self.order.menuItems[i].discountID='AdjustTotalItem';
																self.order.menuItems[i].discountItemSelected=true;
															}
															self.recalculateDiscount();
														}
														}]
													]
												 ]
										});
										return 0;
								}
								else return 0;
							}
			},
			'AdjustTotalItem': {description:'',
						 mgrApproval:false,
						 type:'item',
						 rtn:function(order,itemAmount) {
							 return itemAmount-itemAmount*order.discountParm;
						 }
			},
			'mgr100Percent':{description:'Manager 100% Complementary',
							 mgrApproval:true,
							 type:'order',
							 rtn:function() {
								var self = posTerminal.posDiscountMgr;
								var order = self.order;
								
								if (!order.discountParm) {
									 if (posTerminal.employees[order.employeeID].type!='manager') {
										posTerminal.posVerifyMgrApproval(self, function(employee){
											order.discountParm = 0.0000001;  // cannot be zero
											for (i in self.order.menuItems) {
												self.order.menuItems[i].discountID='AdjustTotalItem';
												self.order.menuItems[i].discountItemSelected=true;
											}
											self.recalculateDiscount();
										});
									 }
									 else {
										order.discountParm = 0.0000001;		// cannot be zero
										for (i in self.order.menuItems) {
											self.order.menuItems[i].discountID='AdjustTotalItem';
											self.order.menuItems[i].discountItemSelected=true;
										}
										self.recalculateDiscount();
									 }
									 return 0;
								 }
								else return 0;
							 }
			}
		},	
		init: 				function(_order,_dialog) {
			//  posTerminal is global varable
			this.order		 = _order;
			this.dialog		 = _dialog;
			this.fillInDiscounts();
			this.fillInMenuItems();
			this.setupButtons();
		},
		destroy:			function() {
			this.dialog.dialog('destroy');
		},
		setupButtons:		function() {
			var self = this;
			$('#discountButtons').on('click',self,function(e) {
				var target = $(e.target), self = e.data, button = target.text().trim();
				var i, item;
				if (button=='Cancel') {
					self.clearDiscounts();
					posTerminal.posMenuTicketMgr.updateTotalsFromMenuItems();
					self.destroy();
					return;
				}
				else if (button=="OK") {
					posTerminal.posMenuTicketMgr.updateTotalsFromMenuItems();
					self.destroy();
					return;
				}
				else alert('Error in button processing');
			});
			$('#discountOpButtons .actionButton').on('click',self,self.opButtons);
		},
		opButtons:			function(e) {
			var i, item, target = $(e.target), self = e.data, button = target.text().trim();
			switch (button) {
				case 'Select All':
					if (!(self.selectedDiscount && self.discountList[self.selectedDiscount].type=='item')) break;
					for (i in self.order.menuItems) {
						self.order.menuItems[i].discountID=self.selectedDiscount;
						self.order.menuItems[i].discountItemSelected=true;
					}
					self.recalculateDiscount();
					break;
				case 'Unselect All':
					if (!(self.selectedDiscount && self.discountList[self.selectedDiscount].type=='item')) break;
					for (i in self.order.menuItems) {
						self.order.menuItems[i].discountID='';
						self.order.menuItems[i].discountItemSelected=false;
					}
					self.recalculateDiscount();
					break;
				case 'Clear Discounts':
					self.clearDiscounts();
					self.recalculateDiscount();
					break;
			}
		},
		clearDiscounts:		function() {
			var i,self=this;
			self.order.discountID = '';
			self.order.discountParm='';
			self.order.orderDiscount   = 0;
			self.selectedDiscount = '';
			for (i in self.order.menuItems) {
				item = self.order.menuItems[i];
				item.discountID='';
				item.discount = 0;
			}
			for (i in self.order.menuItems) 
				self.order.menuItems[i].discountItemSelected=false;
			posTerminal.posMenuTicketMgr.refreshTicketDisplay();
		},
		fillInDiscounts:	function() {
			var discount, self = this;
			var i,s='';
			var ul = $('#discountList');
			for (i in this.discountList) {
				discount = this.discountList[i];
				if (!discount.description) continue;
				s+='<li data-value="'+ i + '" class="discountListButton">';
				s+=discount.description + '</li>';
			}
			ul.html(s);
			ul.children().on('click',self,this.discountClicked);
		},
		fillInMenuItems:	function() {
			var self = this;
			var i,j, subtotal=0,discountTotal=0, totalTotal, item, discount, color, s='';
			var itemTotal,itemDiscountTotal,itemExempt=false,tax=0;
			for (i in this.order.menuItems) {
				itemExempt = false;
				item = this.order.menuItems[i];
				itemTotal = item.quantity * item.price;
				for (j in item.options) {
					itemTotal+=item.quantity*item.options[j].price;
				}
				if (item.discountID) {
					itemDiscountTotal = this.discountList[item.discountID].rtn(this.order,itemTotal);
				}
				else itemDiscountTotal = 0;
				if (typeof(posTerminal.products[item.productID])!='undefined') {
					if (posTerminal.products[item.productID].taxable==='0') itemExempt=true;
				}
				if (!(this.order.taxExempt || itemExempt)) 
					tax+=(itemTotal-itemDiscountTotal)*parseFloat(posTerminal.options.tax.value);
				
				color = (item.discountItemSelected==true)?'rgb(240, 240, 200)':'rgb(255, 255, 250)';
				item.discount=itemDiscountTotal;
				subtotal+=itemTotal;
				discountTotal+=itemDiscountTotal;
				s+='<div class="menuItem" data-value="' + i + '" style="font-weight:bold;width:420px;height:38px;background-color:'+color+';border-bottom:2px solid grey">';
				s+='<div style="padding:11px 0px;float:left;width:50px;overflow:hidden;">';
				s+= item.quantity;
				s+='</div>';
				s+='<div style="text-align:left;float:left;width:195px;height:40px;overflow:hidden;">';
				s+=item.product;
				s+='<br><hr style="border-color:lightgrey;margin:0px;margin-right:10px">';
				s+=(item.discountID?this.discountList[item.discountID].description:'');
				s+='</div>';
				s+='<div style="padding:11px 0px;text-align:right;float:left;width:70px;overflow:hidden;">';
				s+= parseFloat(itemTotal).toFixed(2); 
				s+='</div>';
				s+='<div style="padding:11px 0px;text-align:rightfloat:left;width:100px;overflow:hidden;">';
				s+= parseFloat(itemDiscountTotal).toFixed(2);
				s+='</div></div>';
			}
			$('#discountItems')
				.children().remove();
			$('#discountItems')	
				.html(s)
				.children().on('click',self,this.menuItemClicked);
			if (this.order.discountID) 
				discountTotal+=this.discountList[this.order.discountID].rtn(this.order,this.subtotal,this.order.discountParm);	
			this.fillInTotalFields(subtotal,discountTotal,tax);	
		},
		fillInTotalFields:	function(subtotal,discountTotal,tax) {
			var stotal = subtotal-discountTotal;
			var total  = stotal+tax;
			$('#discountSubtotal').text(parseFloat(subtotal).toFixed(2));
			$('#discountDiscount').text(parseFloat(discountTotal).toFixed(2));
			$('#discountTax').text(parseFloat(tax).toFixed(2));
			$('#discountTotal').text(parseFloat(total).toFixed(2));
		},
		menuItemClicked:	function(e) {
			var self = e.data, p,target=$(e.target);
			if (!target.hasClass('menuItem')) p = target.parents('.menuItem:first');
			else p = target;	
			
			var menuIndex = p.data('value');
			var menuItem  = self.order.menuItems[menuIndex];
			if (!menuItem.discountItemSelected) {
				menuItem.discountItemSelected=true;
				if (self.selectedDiscount && self.discountList[self.selectedDiscount].type=='item') {
					menuItem.discountID=self.selectedDiscount;
				}
			}
			else {
				menuItem.discountItemSelected=false;
			}
			
			self.recalculateDiscount();
		},
		recalculateDiscount:function() {
			this.fillInMenuItems();
		},
		discountClicked:	function(e) {
			var i, selected, self = e.data,target=$(e.target),ul=target.parent();
			ul.children().removeClass('discountListButtonActive');
			target.addClass('discountListButtonActive');
			selected = target.data('value');
			if (self.discountList[selected].type=='item') {
				self.selectedDiscount = selected;
				for (i in self.order.menuItems) {
					if (self.order.menuItems[i].discountItemSelected) self.order.menuItems[i].discountID = selected;
				}
				self.recalculateDiscount();
			}
			else {
				self.selectedDiscount = '';
				for (i in self.order.menuItems) self.order.menuItems[i].discountID='';
				self.order.discountID = selected;
				self.recalculateDiscount();
			}
		},
		setupKeyboard:		function(keys) {
			var i,j,w,key,s='',self=this;
			self.lastInput=[];
			s+='<div id="posCashTenderDialog" style="background-color:white;width:300px;padding:10px;">';
			s+='	<div style="height:50px;float left;">';
			s+='		<div id="vkTendered" ';
			s+='			class="ui-keyboard-button ui-state-default ui-corner-all"';
			s+='			style="margin-right:10px;float:right;width:115px;text-align:right;border:2px solid lightsteelblue;">';
			s+='		</div>';
			s+='	</div>';
			s+='	<div class="ui-keyboard-keyset ui-keyboard-keyset-normal" style="text-align:right;margin:10px;">';
			for (i in keys){
				for (j in keys[i]) {
					key =keys[i][j].toString();
					w=(key.indexOf("^")==-1)?false:true;
					if (w) key=key.replace('^','');
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
			var value = $('#vkTendered').html(),pre,n, key = $target.text().trim();
			e.stopPropagation();
			if (key == '⌫') {
				n = self.lastInput.pop();
				$('#vkTendered').html(n);
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
			$('#vkTendered').html('$'+n.toFixed(2));
		},
		setupOKCancelButtons:	function() {
			var html = '';
			html += '	<div style="float:left;margin-top:10px;width:100%;height:50px;border-top:2px solid #5c9ccc;text-align:center;padding-top:5px;">';	
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
			return html;
		}
		
	};
