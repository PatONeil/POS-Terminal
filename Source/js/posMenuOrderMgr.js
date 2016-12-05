/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posMenuOrderMgr = {
		defaults:			{
			terminalNumber:	terminalNumber,
			orderNumber:	0,
			orderDate:		'',
			settlementDate:	'',
			deliveryTime:	'',
			employeeID:		null,
			customerName:	'',
			customerID:		0,
			taxExempt:		0,
			orderType:		'Counter Order',
			ticketNumber:	'',
			'status':		'new',
			mode:			'default',	// editing individual item
			mode2:			'',	// editing existing order
			subtotal:		0,
			orderDiscount:	0,
			discountParm:	0,
			discountID:		'',
			totalDiscount:	0,
			mgrDiscountApproval:null,
			tax:			0,
			total:			0,
			cashPayment:	0,
			checkPayment:	0,
			creditCardPayment:0,
			giftCertificatePayment:0,
			corporateCharge:0,
			houseAccountCharge:0,
			amountTendered:	0,
			comments:		'',
			currentTreeNode:null,
			menuIndex:		0,
			itemQuantity:	1,
			menuItems:		[]
		},
		order:{},
		init: 			function(employeeID,order) {
			//debugger;
			var d =  new Date();
			//  posTerminal is global varable
			if (order) {
				this.order=$.extend(true,{},this.defaults,order);
				this.order.mode2='Edit';
			} 
			else {
				this.order = $.extend(true,{},this.defaults);
				posTerminal.lastOrderNumber = posTerminal.lastOrderNumber+1;
				this.order.orderNumber= posTerminal.lastOrderNumber;
				this.order.orderDate = d.toLocaleString();
				this.order.employeeID=employeeID;
			}
			this.initialPayAmount = parseFloat(this.order.cashPayment)+
							 parseFloat(this.order.checkPayment)+
							 parseFloat(this.order.creditCardPayment)+
							 parseFloat(this.order.giftCertificatePayment);
			
			this.order.terminalNumber = terminalNumber;
			this.order.currentTreeNode = posTerminal.menuTree;
			this.loadMenuParts();
			this.setupButtons();
			$('#popupChangeDue').hide();
			posTerminal.logMessage("Order Init: type="+this.order.mode+", lastOrderNumber="+this.order.orderNumber);
		},
		destroy:			function() {
//			delete this.order;
			// events should be cleaned up by remove....
		},
		setupButtons:		function() {
			var self = this;
			$('#ticketDone').on('click',self,function(e) {
				if (self.ticketDone()) self.exitOrder();
			});
			$('#ticketPrint').on('click',self,function(e) {
				if (self.ticketPrint()) self.exitOrder();
			});
			$('#ticketPay').on('click',self,self.ticketPay);
			
			$('#ticketDiscardItem').on('click',self,self.ticketDiscardItem);
			
			$('#ticketQuantity').on('click',self,self.ticketQuantity);
			
			$('#ticketDiscountButton').on('click',self,self.ticketDiscount);
			
			$('#ticketCancel').on('click',self,self.ticketCancel);
			
			$('#ticketNotInMenuItem').on('click',self,self.ticketNotInMenuItem);
			
			$('#ticketComments').on('click',self,self.ticketComments);
			
		},
		exitOrder:			function() {
			posTerminal.page.main();
		},
		recordOrder:		function(prnt) {
			var record,i,j,item,o=[],dt,y,m,d,status = this.order.status;
			var tillAmount = parseFloat(this.order.cashPayment)+
							 parseFloat(this.order.checkPayment)+
							 parseFloat(this.order.giftCertificatePayment);
			if (this.order.cashPayment&& tillAmount>this.order.total) {
				this.order.cashPayment=this.order.total-
									  (parseFloat(this.order.checkPayment)+
									   parseFloat(this.order.giftCertificatePayment));
			}
			if (this.initialPayAmount<tillAmount) posTerminal.openCashDrawer();
			if (tillAmount + parseFloat(this.order.creditCardPayment) >= parseFloat(this.order.total)) {
			   this.order.status='paid';
			   this.order.settlementDate= (new Date()).toLocaleString();
			}
			else if (parseFloat(this.order.corporateCharge)+parseFloat(this.order.houseAccountCharge) > 0) 
				this.order.status='charged';
			else this.order.status='pending';
			record = $.extend(true,{},this.order);
			record.currentTreeNode = '';
			for (i in record.menuItems) {
				item=record.menuItems[i];
				item.menuTreeID = item.menuTree.id;
				delete item.menuTree;
				o = [];
				for (j in item.options) {
					o.push(item.options[j].treeNode.id + '~' + item.options[j].product + '~' + item.options[j].price + '~' + item.options[j].treeNode.subMenu);
				}
				item.options = o.join('^');
			}
			var data =  JSON.stringify(record);
			$.ajax({					
				type: "POST",
				dataType: "json",
				url: "scripts/orderProcessor.php?action="+
					(this.order.mode2=='Edit'?'update':'create')+'&print='+(prnt?'true':'false'),
				data: data,
				success: function( results ) {
					if (results.Result!="OK") {
						alert("posTerminal.posMenuOrderMgr Server Error,"+results.Message);
						return;
					}
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("posTerminal.posMenuOrderMgr: "+textStatus+"  "+errorThrown);
				}
			});
			if (tillAmount > 0) { 
				dt = new Date();
				y= dt.getFullYear().toString().substr(2);
				m = dt.getMonth()<9?'0'+(dt.getMonth()+1).toString():(dt.getMonth()+1).toString();
				d = dt.getDate()<10?'0'+dt.getDate().toString():dt.getDate().toString();
				data = {action:	'tillOrder',
						cash: 	this.order.cashPayment,
						check:	this.order.checkPayment,
						gift:   this.order.giftCertificatePayment,
						num:	y+m+d+'-'+this.order.orderNumber,
						till:	'till'+this.order.terminalNumber,
						employeeID:this.order.employeeID
				};
				$.ajax({					
					type: "POST",
					dataType: "json",
					url: "scripts/tillManager.php",
					data: data,
					success: function( results ) {
						if (results.Result!="OK") {
							alert("tillManager - Server Error,"+results.Message);
							return;
						}
					},
					error: function(jqXHR, textStatus, errorThrown ){
						alert("tillManager: "+textStatus+"  "+errorThrown);
					}
				});
			}	
			if (parseFloat($('#ticketChangeDue').text())!=0) {
				$('#popupChangeDue').html("Change Due: "+$('#ticketChangeDue').text()).
				fadeIn(300).delay(10000).fadeOut(400);
			}
			posTerminal.logMessage("Order recorded: type="+this.order.mode+", lastOrderNumber="+this.order.orderNumber);
		},
		ticketDone:			function(e) {
			var prnt, type=posTerminal.menuTypes[this.order.currentTreeNode.type];
			if (this.order.currentTreeNode.id=='top') {
				if (this.order.menuItems.length==0 && this.order.mode2!='Edit') return true;
				else {
					this.recordOrder(false);
					return true;
				}
			}
			else if (this.order.selectionTreeNode) {
				this.order.selectionTreeNode=null;
				posTerminal.posMenuTicketMenuMgr.refreshMenuFromTree(this.order.currentTreeNode);
			}
			else if (type=='subMenu') {
				posTerminal.posMenuTicketMenuMgr.refreshMenuFromTree(posTerminal.menuTree);
			}	
			else if (type=='menuItem') {
				if (posTerminal.posMenuTicketMenuMgr.menuItemComplete()) {
					prnt = posTerminal.findMenuItem(this.order.currentTreeNode.parent);
					if (posTerminal.menuTypes[prnt.type]=='subMenu')
						posTerminal.posMenuTicketMenuMgr.refreshMenuFromTree(prnt);
					else 
						posTerminal.posMenuTicketMenuMgr.refreshMenuFromTree(posTerminal.menuTree);
					this.order.itemQuantity = 1;
					if (this.order.mode=='Edit') {
						posTerminal.posMenuTicketMenuMgr.endEditMenuItem();
					}
				}
				else alert('Not all required selection are completed');
				return false;
			}
		},
		ticketPrint:		function(e) {
			if (this.order.currentTreeNode.id!='top') {
				alert("Must complete order item before 'Done and Print'.");
				return false;
			}
			if (this.order.menuItems.length==0) return true;
			else {
				this.recordOrder(true);
				return true;
			}
		},
		ticketNotInMenuItem:function(e) {
			var self = e.data;
			var type = posTerminal.menuTypes[self.order.currentTreeNode.type];
			if (type != 'subMenu') return;
			posTerminal.pageLoader({scripts:[['js/posNotInMenuMgr.js','posNotInMenuMgr',['']]]});
		},
		ticketComments:function(e) {
			var self = e.data;
			var type = posTerminal.menuTypes[self.order.currentTreeNode.type];
			if (type != 'subMenu') return;
			posTerminal.pageLoader({scripts:[['js/posOrderCommentsMgr.js','posOrderCommentsMgr',['']]]});
		},
		ticketPay:			function(e) {
			var self = e.data;
			if (self.order.menuItems.length==0) return;
			posTerminal.pageLoader({scripts:[['js/posPaymentMgr.js','posPaymentMgr',[self.order,posTerminal.posMenuTicketMgr,posTerminal.posMenuTicketMgr.refreshTicketDisplay]]]});
		},
		ticketDiscardItem:	function(e) {
			var self = e.data;
			posTerminal.posMenuTicketMgr.deleteMenuItem(self.order.menuIndex);
			if (self.order.mode=='Edit') {
				posTerminal.posMenuTicketMenuMgr.endEditMenuItem();
			}
			self.order.menuIndex=self.order.menuItems.length?self.order.menuItems.length-1:0;
			posTerminal.posMenuTicketMenuMgr.refreshMenuFromTree(posTerminal.menuTree);
		},
		ticketQuantity:		function(e) {
			var self = this,s='',html;
			s+=		'<div id="posMenuQuantity" style="background-color:#f8f8ff;width:100px;float:left;padding:5px;border:2px solid #c8c8ff;">';
			s+=			'	<div style="width:180px;position:static;float:left">';
			s+=			'		<input type="text"  id="vkTendered" ';
			s+=			'			style="border:2px solid lightblue;margin-left:0px;margin-bottom:10px;width:100px;text-align:right"';
			s+=			'           value="" />';
			s+=			'	</div>';
			s+=			'	<div id="posKeyboard" style="clear:both;float:left;display:inline-block;">';
			s+=			'	</div>';
			s+=		'</div>';
			
			$('#posTerminal').append(s);
			$('#posKeyboard').posKeyboard({
					inputID:'vkTendered',
					keySet: 'normal',
					type: 'alpha',
					keys: {normal:['1 2 3',
								  '4 5 6',
								  '7 8 9',
								  '&#8656; 0 &#8656;',
								  'Accept{86}',
								  'Cancel{86}']
						},
					accepted : function() {
						var value = $('#posMenuQuantity input').val();
						var order=posTerminal.posMenuOrderMgr.order;
						var type =posTerminal.menuTypes[order.currentTreeNode.type];
						if (type=='menuItem') {
							posTerminal.posMenuTicketMgr.changeQuantity(order.menuItems[order.menuIndex],value);
						}
						else {
							order.itemQuantity = value;
						}
						$('#posMenuQuantity').remove();
					},
					cancel: function() {
						$('#posMenuQuantity').remove();
					}
					
				});
			$('#posMenuQuantity').position({
						of : $('#ticketDetailContainer'),
						my : 'center center',
						at : 'center center'
					});
		},
		ticketDiscount:		function(e) {
			var self = e.data;
			if (self.order.menuItems.length==0) return;
			$.ajax({
			  url: 'pages/posMenuDiscount.html',
			  data: '',
			  dataType: 'text',
			  success: function(data, textStatus, jqXHR ) {
				$(data).dialog({
					modal: true,
					draggable: true,
					resizable: false,
					position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
					width: 708,
					dialogClass: '',
					open: function( event, ui ) {
						var discountDialog=$(this);
						posTerminal.page.discountPage(self.order,discountDialog);
					},
					close: function( event, ui ) {
						$(this).dialog('destroy').remove();
					}
				});
			  }
			});
		},
		ticketCancel:		function(e)	{
			var self = e.data;
			posTerminal.page.main();
			posTerminal.logMessage("Order Cancel: type="+self.order.mode+", lastOrderNumber="+self.order.orderNumber);
		},
		loadMenuParts:		function() {
			posTerminal.page.orderParts();
		}
	};
