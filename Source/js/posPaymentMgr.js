/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posPaymentMgr = {
		order:				null,
		dialog:				null,
		context:			null,
		rtnFunction:		null,
		noHouseOrCorporate: false,
		init: 				function(order,context,rtnFunction,noHouseOrCorporate) {
			var i;
			//  posTerminal is global varable
			for (i in order) if ($.isNumeric(order[i])) order[i]=parseFloat(order[i]);
			this.order	 = order;
			this.context = context;
			this.rtnFunction=rtnFunction;
			this.noHouseOrCorporate=false;
			this.order.creditCardPayment=0;
			this.order.giftCertificatePayment=0;
			this.order.corporateCharge=0;
			this.order.houseAccountCharge=0;
			this.order.cashPayment=0;
			this.order.checkPayment=0;
			this.order.amountTendered = 0;
			if (noHouseOrCorporate) this.noHouseOrCorporate=true;
			this.setupDialog();
		},
		destroy:			function() {
		},
		setupDialog:		function() {
			var self = this;
			$(posTerminal.loadedPages['pages/posPayment.html']).dialog({
				modal: true,
				draggable: true,
				resizable: false,
				width: 408,
				dialogClass: '',
				position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
				open: function( event, ui ) {
					self.dialog=$(this);
					self.fillInFields();
					self.updateTender();
					self.setupButtons();
				},
				close: function( event, ui ) {
					$(this).dialog('destroy').remove();
				}
			});
		},
		setupButtons:		function() {
			var self = this;
			$('#paymentDialog .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case 'OK':
						self.dialog.dialog('close');
						self.order.amountTendered = 
										 parseFloat(self.order.cashPayment)+
										 parseFloat(self.order.checkPayment)+
										 parseFloat(self.order.creditCardPayment)+
										 parseFloat(self.order.giftCertificatePayment)+
										 parseFloat(self.order.corporateCharge)+
										 parseFloat(self.order.houseAccountCharge);

						if (self.rtnFunction) self.rtnFunction.call(self.context);
						break;
					case 'Cancel':
						self.order.cashPayment=0;
						self.order.checkPayment=0;
						self.order.creditCardPayment=0;
						self.order.giftCertificatePayment=0;
						self.order.corporateCharge=0;
						self.order.houseAccountCharge=0;
						self.order.amountTendered = 0;
						self.dialog.dialog('close');
						break;
					case 'Cash':
						self.handleCash();
						break;
					case 'Gift Certificate':
						self.handleGiftCertificate();
						break;
					case 'Check':
						self.handleCheck();
						break;
					case 'Credit Card':
						self.handleCreditCard();
						break;
					case 'Corporate Charge':
						self.handleCorporateCharge();
						break;
					case 'House Charge':
						self.handleHouseCharge();
						break;
				}
			});
		},
		handleCash:			function() {
			var self = this;
			posTerminal.pageLoader(
				{scripts:[
							['js/posCashTender.js','posCashTender',['cash','Cash Tender',$('#payAmountDue').text(),self,function(amt){
									this.order.cashPayment = (" "+amt).replace(/[^\d.-]/g,'')||0;
									this.updateTender();
								}]
							]
						 ]
				});
		},
		handleCheck:		function() {
			var self = this;
			posTerminal.pageLoader(
				{scripts:[
							['js/posCashTender.js','posCashTender',['check','Check Amount',$('#payAmountDue').text(),self,function(amt){
									this.order.checkPayment = (" "+amt).replace(/[^\d.-]/g,'')||0;
									this.updateTender();
								}]
							]
						 ]
				});
		},
		handleCreditCard:	function() {
			var self = this;
			posTerminal.pageLoader(
				{scripts:[
							['js/posCashTender.js','posCashTender',['check','Credit Card Amount',$('#payAmountDue').text(),self,function(amt){
									this.order.creditCardPayment = (" "+amt).replace(/[^\d.-]/g,'')||0;
									this.updateTender();
								}]
							]
						 ]
				});
		},
		handleCorporateCharge:function() {
			if (!this.order.customerID||this.order.customerID==0) {
				alert("Corporate Customer must be specified");
				return;
			}
			if (posTerminal.customers[this.order.customerID].type!='corporate') {
				alert("Customer is not a corporate customer");
				return;
			}
			this.order.corporateCharge = this.order.total;
			this.updateTender();
		},
		handleHouseCharge:	function() {
			if (!this.order.customerID||this.order.customerID==0) {
				alert("House Account customer must be specified");
				return;
			}
			if (posTerminal.customers[this.order.customerID].type!='house') {
				alert("Customer is not a house account customer");
				return;
			}
			this.order.houseAccountCharge = this.order.total;
			this.updateTender();
		},
		handleGiftCertificate:function() {
			var self = this;
			posTerminal.pageLoader(
				{scripts:[
							['js/posCashTender.js','posCashTender',['cash','Certificate Amount',$('#payAmountDue').text(),self,function(amt){
									this.order.giftCertificatePayment = (" "+amt).replace(/[^\d.-]/g,'')||0;
									this.updateTender();
								}]
							]
						 ]
				});
		},
		updateTender:		function() {
			var totalPay=0, html='', payTender = $('#payTenderContainer');
			payTender.children().remove();
			if (this.order.cashPayment!==0) {
				totalPay+=parseFloat(this.order.cashPayment);
				html+=this.generateTender('Cash',this.order.cashPayment);
			}
			if (this.order.checkPayment!==0) {
				totalPay+=parseFloat(this.order.checkPayment);
				html+=this.generateTender('Check',this.order.checkPayment);
			}
			if (this.order.creditCardPayment!==0) {
				totalPay+=parseFloat(this.order.creditCardPayment);
				html+=this.generateTender('Credit Card',this.order.creditCardPayment);
			}
			if (this.order.giftCertificatePayment!==0) {
				totalPay+=parseFloat(this.order.giftCertificatePayment);
				html+=this.generateTender('Gift Certificate',this.order.giftCertificatePayment);
			}
			if (this.order.corporateCharge!==0) {
				totalPay+=parseFloat(this.order.corporateCharge);
				html+=this.generateTender('Corporate Charge',this.order.corporateCharge);
			}
			if (this.order.houseAccountCharge!==0) {
				totalPay+=parseFloat(this.order.houseAccountCharge);
				html+=this.generateTender('House Account',this.order.houseAccountCharge);
			}
			payTender.html(html);
			if (this.order.total-totalPay > 0) {
				$('#payAmountDue').html(parseFloat(this.order.total-totalPay).toFixed(2));
				$('#payAmountText').html('Tender Reqd.');
			}
			else {
				$('#payAmountText').html('<b>Change Due</b>');
				$('#payAmountDue').html(parseFloat(totalPay-this.order.total).toFixed(2));
			}
			
		},
		generateTender:		function(type,amount) {
			var s='';
				s+='<div style="width:178px;height:24px;border-bottom:1px solid lightgrey;">';
				s+='	<div style="width:105px;float:left;text-align:left;padding:5px 5px;">';
				s+=			type;
				s+='	</div>';
				s+='	<div style="width:57px;float:left;text-align:right;padding:5px 5px;padding-left:0px">';
				s+=			parseFloat(amount).toFixed(2);
				s+='	</div>';
				s+='</div>';
			return s;
		},
		fillInFields:		function() {
			$('#payOrderSubtotal').text(parseFloat(this.order.subtotal).toFixed(2));
			$('#payOrderDiscount').text(parseFloat(this.order.totalDiscount).toFixed(2));
			$('#payOrderTax').text(parseFloat(this.order.tax).toFixed(2));
			$('#payOrderTotal').text(parseFloat(this.order.total).toFixed(2));
			$('#payOrderEmployee').text(posTerminal.employees[this.order.employeeID].name);
			$('#payOrderCustomer').text(this.order.customerName);
			$('#payOrderNumber').text(this.order.orderNumber);
			if (this.order.orderDate.indexOf('/')!= -1)
				$('#payOrderDate').text(this.order.orderDate.substr(0,this.order.orderDate.length-6));
			else $('#payOrderDate').text(this.order.orderDate);
			if (this.noHouseOrCorporate) {
				$('#posPayCorporate').hide();
				$('#posPayHouse').hide();
			}
		}
	};
