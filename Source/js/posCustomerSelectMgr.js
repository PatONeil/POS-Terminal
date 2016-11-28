/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posCustomerSelectMgr = {
		order:			null,
		dialog:				null,
		init: 				function(_order) {
			//  posTerminal is global varable
			this.order	 = _order;
			var self = this;
					$(posTerminal.loadedPages['pages/posCustomerSelect.html']).dialog({
						modal: true,
						draggable: true,
						resizable: false,
						width: 800,
						dialogClass: '',
						position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
						open: function( event, ui ) {
							self.dialog = $(this);
							self.fillInFields();
							self.setupButtons();
							self.setupKeyboard();
						},
						close: function( event, ui ) {
							$(this).dialog('destroy').remove();
						}
					});
		},
		setupKeyboard:		function() {
			var self = this;
			$('#posKeyboard').posKeyboard({
				inputID: 'oneTimeName',
				keySet: 'normal'
			});
		},
		destroy:			function() {
			this.dialog.dialog('destroy').remove();
		},
		setupButtons:		function() {
			var self = this;
			$('#customerSelectDialog .actionButton').on('click',self,function(e) {
				var i,v=-1,button = $(e.target).text().trim();
				switch (button) {
					case 'OK':
						$('#customerSelectDialog').find('select').each(function(index,element){
							if (v!=-1) return;
							var n = $(element).val();
							if (n && n!=-1) v=n;
						});
						if (v && v!=-1) {
							for (i in posTerminal.customers) if (posTerminal.customers[i].id==v)break;
							self.order.customerID=v;
							self.order.customerName = posTerminal.customers[i].name;
							self.order.taxExempt = parseInt(posTerminal.customers[i].taxExempt);
							$('#ticketCustomer div').text(self.order.customerName);
							posTerminal.posMenuTicketMgr.refreshTicketDisplay();
						}
						else {
							v = $('#customerSelectDialog').find('input').val();
							if (v) {
								self.order.customerID=0;
								self.order.customerName  =v;
								$('#ticketCustomer div').text(self.order.customerName);
							}
						}
						self.dialog.dialog('close');
						break;
					case 'Cancel':
						self.dialog.dialog('close');
						break;
					case 'Add Customer':
						posTerminal.pageLoader({scripts:[['js/posCustomerInputMgr.js','posCustomerInputMgr',[]]]});
						//alert("Add customer not yet supported. Use customer edit function in Manager's page.");
						break;
				}	
			});
		},
		fillInFields:		function() {
			var o,c, customers = posTerminal.customers, i;
			var cust=[];
			$('#customerSelectDialog').find('#regularSelect').children().remove();
			$('#customerSelectDialog').find('#houseSelect').children().remove();
			$('#customerSelectDialog').find('#custSelect').children().remove();
			for (i in customers) cust.push(customers[i]);
			cust.sort(function(a,b){if (a.name==b.name) return 0; return a.name<b.name?-1:1;});
			o='<option style="font-size:22px;" value="-1">Select customer</option>'
			for (i in cust) {
				c = cust[i];
				if (c.type!='regular') continue;
				o+='<option style="font-size:22px;" value="'+c.id+'">'+c.name+'</options>';
			}
			$('#customerSelectDialog').find('#regularSelect').html(o);
			o='<option style="font-size:22px;" value="-1">Select customer</option>'
			for (i in cust) {
				c = cust[i];
				if (c.type!='house') continue;
				o+='<option style="font-size:22px;" value="'+c.id+'">'+c.name+'</options>';
			}
			$('#customerSelectDialog').find('#houseSelect').html(o);
			o='<option style="font-size:22px;" value="-1">Select customer</option>'
			for (i in cust) {
				c = cust[i];
				if (c.type!='corporate') continue;
				o+='<option style="font-size:22px;" value="'+c.id+'">'+c.name+'</options>';
			}
			$('#customerSelectDialog').find('#custSelect').html(o);
		}
	};
