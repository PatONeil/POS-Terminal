/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posViewOrdersMgr = {
		selection:			'',
		currentOrder:		'',
		init: 				function() {
			var self=this;
			//  posTerminal is global varable
			this.setupButtons();
			$('#viewOrderSelect').on('change',self,function(e) {
				self.getSelection();
			});
			this.getSelection();
		},
		destroy:			function() {
			$('#posTerminal').children().remove();
		},
		getSelection:		function() {
			var self = this;
			var sel = $('#viewOrderSelect').val();
			this.selection = sel;
			$.ajax({					
				type: "POST",
				dataType: "json",
				url: "scripts/orderProcessor.php",
				data: {action:'viewQuery',
					   sel:sel
					   },
				success: function( results ) {
					if (results.Result!="OK") {
						alert("View Order Mgr Server Error,"+results.Message);
						return;
					}
					self.records = results.Records;
					self.displayRecords(results.Records);
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("ViewOrderMgr: "+textStatus+"  "+errorThrown);
				}
			});
		},
		displayRecords:		function(records) {
			var i,record,html = '',self=this,paid;
			for (i in records) {
				record = records[i];
				paid = parseFloat(record.cashPayment)+parseFloat(record.checkPayment)+parseFloat(record.creditCardPayment)+parseFloat(record.giftCertificatePayment);
				html += '<tr data-orderid="'+record.id+'">';
				html += '<td style="padding:1px 8px;display:inline-block;text-align:center;width:28px">'+record.terminalNumber+'</td>';
				html += '<td style="padding:1px 8px;display:inline-block;text-align:center;width:28px">'+record.orderNumber+'</td>';
				html += '<td style="padding:1px 8px;display:inline-block;width:170px;">'+record.date+'</td>';
				html += '<td style="padding:1px 8px;display:inline-block;width:90px;">'+record.employee+'</td>';
				html += '<td style="padding:1px 8px;display:inline-block;width:90px;">'+record.customerName+'</td>';
				html += '<td style="padding:1px 8px;display:inline-block;width:60px;">'+record['status']+'</td>';
				html += '<td style="padding:1px 8px;display:inline-block;text-align:right;width:65px;">'+parseFloat(record.subtotal).toFixed(2)+'</td>';
				html += '<td style="padding:1px 8px;display:inline-block;text-align:right;width:65px;">'+parseFloat(record.totalDiscount).toFixed(2)+'</td>';
				html += '<td style="padding:1px 8px;display:inline-block;text-align:right;width:65px;">'+parseFloat(record.tax).toFixed(2)+'</td>';
				html += '<td style="padding:1px 8px;display:inline-block;text-align:right;width:65px;">'+parseFloat(record.total).toFixed(2)+'</td>';
				html += '<td style="padding:1px 8px;display:inline-block;text-align:right;width:65px;">'+paid.toFixed(2)+'</td>';
				html += '</tr>';
			}
			$('#ViewOrderContainer').children().remove();
			$('#ViewOrderContainer').html(html)
				.find('tr').on('click',self,this.orderClicked);
		},
		orderClicked:		function(e) {
			var i,self = e.data;
			self.currentOrder = $(this).data('orderid');
			for (i in self.records) {
				if (self.records[i].id==self.currentOrder) break;
			}
			self.currentOrderIndex = i;
			$('#ViewOrderContainer tr').css('background-color','');
			$(this).css('background-color','#5c9ccc');
		},
		setupButtons:		function(){
			var self = this,sel;
			$('#viewOrderMgrButtons .actionButton').on('click',self,function(e) {
				var order,button = $(e.target).text().trim();
				switch (button) {
					case 'Done':
						posTerminal.page.main();
						break;
					case 'Pay':
						if (self.currentOrderIndex==='') break;
						order = self.records[self.currentOrderIndex];
						sel = $('#viewOrderSelect').val();
						if (sel=='houseOrders') self.payHouseOrder();
						else if (order.status=='charged' && parseFloat(order.houseAccountCharge)!=0)  self.payHouseOrder();
						else if (sel=='corporateOrders') self.payCorporateOrder();
						else if (order.status=='charged' && parseFloat(order.corporateCharge)!=0)  self.payCorporateOrder();
						else if (order.status!='paid') self.payOrder();
						break;
					case 'Print':
						if (self.currentOrderIndex!=='')
							self.printOrder();
						break;
					case 'View':
						if (self.currentOrderIndex!=='')
							posTerminal.pageLoader({scripts:[['js/posViewOrderDetailMgr.js','posViewOrderDetailMgr',[self.currentOrder]]]});
						break;
					case 'Edit':
						if (self.currentOrderIndex!==''){
							if (self.records[self.currentOrderIndex].status=='Paid') {
								alert("Cannot edit paid order!!");
								return;
							}
							posTerminal.pageLoader({scripts:[['js/posViewOrderEditMgr.js','posViewOrderEditMgr',[self.currentOrder]]]});
						}
						break;
					default:
						posTerminal.page.main();
						break;
				}
			});
		},
		printOrder:	   function() {
			var record = this.records[this.currentOrderIndex];
			var self=this;
			$.ajax({					
				type: "POST",
				dataType: "text",
				url: "scripts/printOrder.php",
				data: {action:'printOrder',
					   id:self.currentOrder,
					   type:'receipt'
					   },
				success: function( results ) {
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Print Order Mgr: "+textStatus+"  "+errorThrown);
				}
			});
		},
		payHouseOrder: function() {
			var record = this.records[this.currentOrderIndex];
			var customerID = record.customerID;
			var order = {total:0,subtotal:0,totalDiscount:0,tax:0,cashPayment:0,checkPayment:0,creditCardPayment:0,
			giftCertificatePayment:0,corporateCharge:0,houseAccountCharge:0,orderDate:'Various',
			orderNumber:'Various',employeeID:record.employeeID,customerName:record.customerName,customerID:customerID};
			var i,paid=0;
			for (i in this.records) {
				record=this.records[i];
				if (record.customerID!=customerID) continue;
				order.subtotal+=parseFloat(record.subtotal);
				order.total   +=parseFloat(record.total);
				order.discount+=parseFloat(record.totalDiscount);
				order.tax	  +=parseFloat(record.tax);
				paid +=  parseFloat(record.cashPayment)+
						 parseFloat(record.checkPayment)+
						 parseFloat(record.creditCardPayment)+
						 parseFloat(record.giftCertificatePayment);
			}
			order.total -= paid;
			this.order = order;
			posTerminal.pageLoader({scripts:[['js/posPaymentMgr.js','posPaymentMgr',[order,this,this.updateHousePayment,true]]]});
		},
		payCorporateOrder: function() {
			var record = this.records[this.currentOrderIndex];
			var customerID = record.customerID;
			var order = {total:0,subtotal:0,totalDiscount:0,tax:0,cashPayment:0,checkPayment:0,creditCardPayment:0,
			giftCertificatePayment:0,corporateCharge:0,houseAccountCharge:0,orderDate:'Various',
			orderNumber:record.orderNumber,employeeID:record.employeeID,customerName:record.customerName,customerID:customerID};
			var paid=0;
			order.subtotal+=parseFloat(record.subtotal);
			order.total   +=parseFloat(record.total);
			order.discount+=parseFloat(record.totalDiscount);
			order.tax	  +=parseFloat(record.tax);
			paid +=  parseFloat(record.cashPayment)+
					 parseFloat(record.checkPayment)+
					 parseFloat(record.creditCardPayment)+
					 parseFloat(record.giftCertificatePayment);
			order.total -= paid;
			this.order = order;
			posTerminal.pageLoader({scripts:[['js/posPaymentMgr.js','posPaymentMgr',[order,this,this.updateCorporatePayment,true]]]});
		},
		payOrder:			function() {
			var self=this;
			$.ajax({					
				type: "POST",
				dataType: "json",
				url: "scripts/orderProcessor.php",
				data: {action:'getOrder',
					   id:self.currentOrder
					   },
				success: function( results ) {
					if (results.Result!="OK") {
						alert("View Order Mgr Server Error,"+results.Message);
						return;
					}
					self.order = results.Record;
					posTerminal.pageLoader({scripts:[['js/posPaymentMgr.js','posPaymentMgr',[self.order,self,self.updatePayment]]]});
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("ViewOrderMgr: "+textStatus+"  "+errorThrown);
				}
			});
		},
		updateCorporatePayment:function() {
			var data,status = this.order.status,self=this,i,paid,unpaid; 
			var cash,check;
			var order = this.records[this.currentOrderIndex];
			this.order.cashPayment 		= parseFloat(this.order.cashPayment);
			this.order.checkPayment		= parseFloat(this.order.checkPayment);
			this.order.creditCardPayment		= parseFloat(this.order.creditCardPayment);
			var payAmt = this.order.cashPayment+
						 this.order.checkPayment+
						 this.order.creditCardPayment;
			if (payAmt==0) return;
			if (payAmt == this.order.total) order.status='paid';
			this.updateOrderDatabase(order,true);
		},
		updateHousePayment:function() {
			var data,status = this.order.status,self=this,i,record,order,paid,unpaid; 
			var cash,check;
			var customerID				= this.order.customerID;
			cash  = this.order.cashPayment 		= parseFloat(this.order.cashPayment);
			check = this.order.checkPayment		= parseFloat(this.order.checkPayment);
			this.order.creditCardPayment		= parseFloat(this.order.creditCardPayment);
			var payAmt = this.order.cashPayment+
						 this.order.checkPayment+
						 this.order.creditCardPayment;
			var totalPay = payAmt;
			if (payAmt==0) return;
			for (i=this.records.length-1;i>=0&&payAmt>0;i--) {
				record = this.records[i];
				record.cashPayment 		= parseFloat(record.cashPayment);
				record.checkPayment		= parseFloat(record.checkPayment);
				record.creditCardPayment= parseFloat(record.creditCardPayment);
				record.total			= parseFloat(record.total);
				unpaid = record.total - (record.cashPayment+record.checkPayment+record.creditCardPayment);
				if (record.customerID!=this.order.customerID) continue;
				paid = 0;
				order = {total:0,subtotal:0,discount:0,tax:0,cashPayment:0,checkPayment:0,creditCardPayment:0,
						 giftCertificatePayment:0,corporateCharge:0,houseAccountCharge:0,orderDate:record.orderDate,
						 orderNumber:record.orderNumber,employeeID:record.employeeID,customerName:record.customerName,
						 customerID:customerID,status:'paid',id:record.id};
				if (this.order.cashPayment>=unpaid) {
					this.order.cashPayment-=unpaid;
					order.cashPayment = record.total;
					payAmt-=unpaid;
					paid += unpaid;
					order.status='paid';
				}
				else if (this.order.cashPayment>0) {
					order.status='charged';
					payAmt-=this.order.cashPayment;
					paid += this.order.cashPayment;
					order.cashPayment = this.order.cashPayment+record.cashPayment;
					this.order.cashPayment=0;
				}
				if (paid<unpaid && this.order.checkPayment>=unpaid) {
					this.order.checkPayment-=unpaid;
					order.checkPayment = record.total;
					payAmt-=unpaid;
					paid += unpaid;
					order.status='paid';
				}
				else if (paid<unpaid && this.order.checkPayment>0) {
					order.status='charged';
					payAmt-=this.order.checkPayment;
					paid += this.order.checkPayment;
					order.checkPayment = this.order.checkPayment+record.checkPayment;
					this.order.checkPayment=0;
				}
				if (paid<unpaid && this.order.creditCardPayment>=unpaid) {
					this.order.creditCardPayment-=unpaid;
					order.creditCardPayment = record.total;
					payAmt-=unpaid;
					paid += unpaid;
					order.status='paid';
				}
				else if (paid<unpaid && this.order.creditCardPayment>0) {
					order.status='charged';
					payAmt-=this.order.creditCardPayment;
					paid += this.order.creditCardPayment;
					order.creditCardPayment = this.order.creditCardPayment+record.creditCardPayment;
					this.order.creditCardPayment=0;
				}
				order.houseAccountCharge -= paid;
				this.updateOrderDatabase(order,(payAmt==0 || totalPay-payAmt>=this.order.total?true:false));
				
			}
		},
		updateTill:		function(cash,check) {
			posTerminal.openCashDrawer();
			var data = {action:	'tillOrder',
						cash: 	cash,
						check:	check,
						num:	"House Account Payment",
						till:	'till'+terminalNumber,
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
		},
		updatePayment:	function() {
			var data,status = this.order.status,self=this;
			var payAmt = parseFloat(this.order.cashPayment)+
						 parseFloat(this.order.checkPayment)+
						 parseFloat(this.order.giftCertificatePayment);
			var totalPay=payAmt+
						 parseFloat(this.order.creditCardPayment)+
						 parseFloat(this.order.corporateCharge)+
						 parseFloat(this.order.houseAccountCharge);

						 
			if (totalPay==0) return;
			if (payAmt) posTerminal.openCashDrawer();
			this.inUpdate = false;
			self.currentOrder = '';
			if (payAmt+parseFloat(this.order.creditCardPayment)>=parseFloat(this.order.total)) {
			   this.order.status='paid';
			   this.order.settlementDate= (new Date()).toLocaleString();
			}
			else if (parseFloat(this.order.corporateCharge)+parseFloat(this.order.houseAccountCharge) > 0) 
				this.order.status='charged';
			else this.order.status='pending';
			this.order.currentTreeNode= '';
			this.updateOrderDatabase(this.order,true);
		},
		updateOrderDatabase: function(order,updateSelection) {
			var self = this;
			var data =  { action:'updatePayment',
					  id: order.id,
					  status: order.status,
					  cashPayment: order.cashPayment,
					  checkPayment:order.checkPayment,
					  creditCardPayment:order.creditCardPayment,
					  giftCertificatePayment:order.giftCertificatePayment
			};
			$.ajax({					
				type: "POST",
				dataType: "json",
				url: "scripts/orderProcessor.php",
				data: data,
				success: function( results ) {
					if (results.Result!="OK") {
						alert("posTerminal.posMenuOrderMgr Server Error,"+results.Message);
						return;
					}
					if (updateSelection) self.getSelection();
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("posTerminal.posMenuOrderMgr: "+textStatus+"  "+errorThrown);
				}
			});
			if (
					(parseFloat(order.cashPayment)+
					 parseFloat(order.checkPayment)+
//					 parseFloat(order.creditCardPayment)+
					 parseFloat(order.giftCertificatePayment)
					) > 0) { 
				data = {action:	'tillOrder',
						cash: 	order.cashPayment,
						check:	order.checkPayment,
						gift:   order.giftCertificatePayment,
						num:	order.id,
						till:	'till'+terminalNumber,
						employeeID: order.employeeID
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
		}
	
	};
