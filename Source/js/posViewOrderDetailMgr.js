/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posViewOrderDetailMgr = {
		dialog:				null,
		orderID:			null, 
		order:				null,
		init: 				function(orderID)  {
			var self = this;
			//  posTerminal is global varable
			this.orderID	= orderID;
			$.ajax({					
				type: "POST",
				dataType: "json",
				url: "scripts/orderProcessor.php",
				data: {action:'getOrder',
					   id:orderID
					   },
				success: function( results ) {
					if (results.Result!="OK") {
						alert("View Order Mgr Server Error,"+results.Message);
						return;
					}
					self.order = results.Record;
					self.setupDialog();
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("ViewOrderMgr: "+textStatus+"  "+errorThrown);
				}
			});
		},
		destroy:			function() {
			this.dialog.dialog('destroy');
		},
		setupDialog:		function() {
			var self = this;
			$(this.setupHTML()).dialog({
				modal: true,
				draggable: true,
				resizable: false,
				width: 430,
				position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
				dialogClass: '',
				buttons: [
					{ text: "OK",
					  click: function() {
						$( this ).dialog( "close" );
					  }
					}
				],
				open: function( event, ui ) {
				},
				close: function( event, ui ) {
					$(this).dialog('destroy').remove();
				}
			});
		},
		setupHTML:			function() {
			var s='';
			s+='<div title="View Order" style="width:424px;overflow:hidden;">';
			s+= 	this.setupHTML_1();
			s+='</div>';
			return s;
		},
		setupHTML_1:		function() {
			var html = '';
			html+='	<div class="menuTicketPageHeader" style="border:1px solid grey;width:424px;height:38px;float:left;padding:0px;margin:0px;" id="ticketTopContainer">';
			html+='			<div style="float:left;width:180px;height:38px">';
			html+='				<div class="flatTicket" style="font-weight: bold;padding-top: 3px;border-right:1px solid gray;font-size:14px;text-align:center;width:100%;height:40px;" id="timeOfTicket">';
			html+='					Ticket Time<br>';
			html+=					this.order.orderDate;
			html+='				</div>';
			html+='			</div>';
			html+='			<div style="float:left;width:94px;height:38px;">';
			html+='				<div class="flatTicket" style="font-weight: bold;padding-top: 3px;border-right:1px solid gray;font-size:14px;text-align:center;width:100%;height:40px;" id="ticketOrderNumber">';
			html+='					Order No.<br>';
			html+=					this.order.orderNumber;
			html+='				</div>';
			html+='			</div>';
			html+='			<div style="float:left;width:148px;height:38px;">';
			html+='				<div class="flatTicket" style="font-weight: bold;padding-top: 3px;font-size:14px;text-align:center;width:100%;height:40px;" id="employeeForTicket">';
			html+='					Employee<br>';
			html+=					posTerminal.employees[this.order.employeeID].name;				
			html+='				</div>';
			html+='			</div>';
			html+='	</div>';
			html+='	<div style="clear:both;width:424px;padding:0px;margin:0px;">';
			html+='		<table style="table-layout:fixed;" id="">';
			html+='			<thead style="display:block;"><tr>';
			html+='				<td style="width:38px;">Qty</td>';
			html+='				<td style="width:300px !important;">Description</td>';
			html+='				<td>Price</td>';
			html+='			</tr></thead>';
			html+='			<tbody style="overflow-y:scroll;display:block;width:415px;height:330px;">';
			html+=			 this.setupHTML_2();
			html+='			</tbody>';
			html+='		</table>';
			html+='	</div>';
			html+='	<div style="clear:both;background-color:#dfe8b8;width:424px;padding:0px;margin:0px;border:1px solid gray;" id="ticketSummaryContainer">';
			html+='		<div style="float:left;width:230px;" id="LeftSummaryOfTicket">';
			html+=			this.setupHTML_3();
			html+='		</div>  <!--  					id=LeftSummaryOfTicket 	-->';
			html+='		<div style="float:left;width:180px;" id="RightSummaryOfTicket">';
			html+='			<table><tbody style="font-size:16px;">';
			html+='				<tr>';
			html+='					<td>Subtotal</td>';
			html+='					<td>'+parseFloat(this.order.subtotal).toFixed(2)+'</td>';
			html+='				</tr>';
			html+='				<tr>';
			html+='					<td>Discount</td>';
			html+='					<td>'+parseFloat(this.order.totalDiscount).toFixed(2)+'</td>';
			html+='				</tr>';
			html+='				<tr>';
			html+='					<td>Sales Tax</td>';
			html+='					<td>'+parseFloat(this.order.tax).toFixed(2)+'</td>';
			html+='				</tr>';
			html+='				<tr>';
			html+='					<td>Total</td>';
			html+='					<td>'+parseFloat(this.order.total).toFixed(2)+'</td>';
			html+='				</tr>';
			html+='			</tbody></table>';
			html+='		</div>';
			html+='	</div>';
			return html;
		},
		setupHTML_3:		    function() {
			var html='';
			html+='	<div id="menuTicketButtons" style="margin:5px;float:left;width:230px;" id="LeftSummaryOfTicket">';
			html+='		<div style="margin-top:5px;width:200px;height:30px;" class="actionButton">';
			html+='			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			html+=				this.order.orderType;
			html+='			</div>';
			html+='		</div>';
			html+='		<div style="margin-top:5px;width:200px;height:30px;" class="actionButton">';
			html+='			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			html+=				this.order.ticketNumber?this.order.ticketNumber:'No Ticket Number';
			html+='			</div>';
			html+='		</div>';
			html+='		<div style="margin-top:5px;width:200px;height:30px;" class="actionButton">';
			html+='			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			html+=				this.order.deliveryTime?this.order.deliveryTime:'No Delivery Time';
			html+='			</div>';
			html+='		</div>';
			html+='		<div style="margin-top:5px;width:200px;height:30px;" class="actionButton">';
			html+='			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			html+=				this.order.customerName?this.order.customerName:'No Customer Name';
			html+='			</div>';
			html+='		</div>';
			html+='	</div>';
			return html;
		},
		setupHTML_2:			function() {
			return this.refreshTicketDisplay();
		},
		refreshTicketDisplay:	 function(){
			var html='';
			var menuItem,menuItems=this.order.menuItems,i;
			for (i in menuItems) {
				menuItem = menuItems[i];
				if (menuItem.menuTreeID) html+=this.displayMenuItem(menuItem);
				else				     html+=this.displayNotInMenuItem(menuItem);
			}
			if (this.order.comments)     html+=this.displayComments();
			return html;
		},
		displayComments:		 function() {
			var html="";
			html+='<tr><td></td></tr><tr>';
			html+='		<td colspan="3" style="text-align:left;font-size:16px;">' + this.order.comments + '</td>';
			html+='</tr>';
			return html;
		},
		displayNotInMenuItem:	 function(menuItem) {
			var html='';
			var displayPrice = (menuItem.price)*menuItem.quantity;
			displayPrice = parseFloat(displayPrice).toFixed(2);
			html+='<tr id = "' + menuItem.id + '" class="' + menuItem.id + ' selectable">';
			html+='		<td style="font-size:16px;width:38px;">' + menuItem.quantity + '</td>';
			html+='		<td style="font-size:16px;width:300px">' + menuItem.product + '</td>';
			html+='		<td style="font-size:16px;">' + displayPrice + '</td>';
			html+='</tr>';
			return html;
		},
		displayMenuItem:         function(menuItem){
			var i,item,html='',price;
			var displayPrice = (menuItem.price)*menuItem.quantity;
			displayPrice = parseFloat(displayPrice).toFixed(2);
			html+='<tr>';
			html+='		<td style="font-size:16px;width:38px;">' + menuItem.quantity + '</td>';
			html+='		<td style="font-size:16px;width:300px;">' + menuItem.product + '</td>';
			html+='		<td style="font-size:16px;">' + displayPrice + '</td>';
			html+='</tr>';
			for (i in menuItem.options) {
				item = menuItem.options[i];
				price = item.price?parseFloat(item.price*menuItem.quantity).toFixed(2):'';
				html+='<tr>';
				html+='		<td></td>';
				html+='		<td style="font-size:16px;width:300px;">' + item.product + '</td>';
				html+='		<td style="font-size:16px;">' + price + '</td>';
				html+='</tr>';
			}
			return html;
		}
		
		
	};
