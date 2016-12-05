/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
/* 	menuTicketManager.js
*/		
	posTerminal.posMenuTicketMgr = {
		DOM_Node:				null,
		posTerminal:		null,
		order:					null,
		products:				'',
		init:					function(order) {
			this.DOM_Node      		= $('#ticketContainer');
			//  posTerminal is global varable
			this.order		 		= posTerminal.posMenuOrderMgr.order;
			$('#timeOfTicket').html('Time of Ticket<br>'+this.formatDate(this.order.orderDate));
			$('#employeeForTicket').html("Employee<br>"+posTerminal.employees[this.order.employeeID].name);
			$('#ticketOrderNumber').html("Order No.<br>"+this.order.orderNumber);
			this.products			= posTerminal.products;
			this.setupInitialEvents();
			if (this.order.mode2=='Edit') { // existing order being edited
				this.setupOrderEdit();
			}
		},
		destroy:				function() {	// unload any events..
		},
		setupOrderEdit:			function() {
			this.refreshTicketDisplay();
			$('#modeOfTicket div').html("Mode<br>Edit Order").addClass("css_blink");
			$('#ticketTypeOfService div').text(this.order.orderType);
			if (this.order.deliveryTime)
				$('#ticketDeliveryTime div').text("Del: "+this.formatDate(this.order.deliveryTime));
			if (this.order.customerName) 
				$('#ticketCustomer div').text(this.order.customerName);
			if (this.order.ticketNumber)
				$('#ticketDineInNumber div').text(this.order.ticketNumber);
		},
		setupInitialEvents:		function()  {
			var self = this;
			$(".serviceType").on('click',self,self.serviceType);
			$('#ticketCustomer').on('click',self,this.getCustomer);
		},
		serviceType:			function(e) {
			var self = e.data;
			var button = $(e.target).text().trim().substr(0,4);
			var dineIn = $('#ticketDineInNumber').hasClass('active');
			$(".serviceType").removeClass("active");
			$(e.currentTarget).addClass("active");
			switch (button) {
				case "Dine":
					self.order.orderType="Dine In";
					if (dineIn) self.getTableNumber();
					break;
				case "Take":
					self.order.orderType="Take Out";
					$('#ticketDineInNumber div').html('Dine<br>In');
					break;
				case "Deli":
					self.order.orderType="Delivery";
					$('#ticketDineInNumber div').html('Dine<br>In');
					self.getDeliveryTime();
					break;
			}
			
		},
		formatDate:				function(date) {
			if (typeof date=='string') date = new Date(date);
			var hours = date.getHours();
			var minutes = date.getMinutes();
			var ampm = hours >= 12 ? 'pm' : 'am';
			hours = hours % 12;
			hours = hours ? hours : 12; // the hour '0' should be '12'
			minutes = minutes < 10 ? '0'+minutes : minutes;
			var strTime = hours + ':' + minutes + ' ' + ampm;
			return date.getMonth()+1 + "/" + date.getDate() + "/" +  "  " + strTime;
		},
		getDeliveryTime:		function() {
			var self = this;
			$('#hiddenInput').datetimepicker({
				controlType: 'select',
				showButtonPanel:true,
				stepMinute: 5,
				hourMin: 6,
				hourMax: 20,
				oneLine: true,
				timeFormat: 'hh:mm tt',
				onClose: function( dateText, inst ) {
					if (dateText) {
						var d = new Date(dateText);
						self.order.deliveryTime = d;
						$('#ticketDeliveryTime div').text("Del: "+self.formatDate(d));
					}
					$(this).datetimepicker('destroy').remove();
					//alert("date is "+dateText);
				},
				beforeShow: function (input, inst) {
					setTimeout(function () {
						inst.dpDiv.css({
							top: 300,
							left: 220
						});
					}, 0);
				}
			});
			$('#hiddenInput').trigger('focus');
		},
		getCustomer:			function(e) {
			var self = e.data;
			posTerminal.page.customerSelectPage(self.order);
		},
		getTableNumber:			function() {
			var self = this,s='',html;
			if ($('#posTableNumber').length) return;   // don't open two dialogs
			s+=		'<div id="posTableNumber" style="background-color:#f8f8ff;width:100px;float:left;padding:5px;border:2px solid #c8c8ff;">';
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
								  'Accept{86}']
						},
					accepted : function() {
						var value = $('#posTableNumber input').val();
						console.log('The table number of "' + value + '" was accepted!');
						self.order.ticketNumber = value;
						if (value) $('#ticketDineInNumber div').html('Dine In<br>'+value);
						else $('#ticketDineInNumber div').html('Dine<br>In');
						$('#posTableNumber').remove();
					}
					
				});
			$('#posTableNumber').position({
						of : $('#ticketDetailContainer'),
						my : 'center center',
						at : 'center center'
					});
		},
		addMenuItem: 			function(menuTree) {
			var quantity = this.order.itemQuantity;
			var menuItem,price;
			if (menuTree.priceOverride!=-1) price = menuTree.priceOverride;
			else if (menuTree.productID) price = this.products[menuTree.productID].price;
			else price = 0;
			menuItem = {id:(new Date()).valueOf(),menuTree:menuTree,
							quantity:quantity,type:posTerminal.menuTypes[menuTree.type],product:menuTree.text,
							productID:menuTree.productID,price:price,discountID:'',discount:0,options:{}};
			this.order.menuItems.push(menuItem);
			this.order.menuIndex = this.order.menuItems.length-1;
			this.order.itemQuantity=1;
			this.refreshTicketDisplay();
		},
		addNotInMenuItem:		function(description,price) {
			var menuItem = {id:(new Date()).valueOf(),menuTree:{id:0},
							quantity:this.order.itemQuantity,type:'NotInMenu',product:'NIM-'+description,
							productID:'NIM Item',price:price,discountID:'',discount:0,options:{}};
			this.order.menuItems.push(menuItem);
			this.order.menuIndex = this.order.menuItems.length-1;
			this.order.itemQuantity=1;
			this.refreshTicketDisplay();
		},
		changeQuantity:			function(menuItem,quantity) {
			menuItem.quantity = quantity;
			this.refreshTicketDisplay();
		},
		refreshTicketDisplay:	 function(){
			var self = this;
			var menuItem,menuItems=this.order.menuItems,i;
			$('#MenuItemRows').children().remove();
			for (i in menuItems) {
				menuItem = menuItems[i];
				if (menuItem.menuTree.id) this.displayMenuItem(menuItem);
				else				      this.displayNotInMenuItem(menuItem);
			}			
			$('#MenuItemRows tr').not(".selectable").children(":nth-child(2)")
				.on('click',self,function(e) {
					var self = e.data;
					var i,order = self.order;
					var desc = $(this).text().replace(/^[ \*]*|$[ ]*/g,'');
					if (desc.substr(0,5) == 'Extra') $(this).html("*  "+desc.substr(6));
					else $(this).html("* Extra "+desc);
				});

			$('#MenuItemRows tr.selectable')
				.on('click',self,function(e) {
					var self = e.data,type;
					var i,order = self.order;
					var menuID = $(this).attr('id');
					for (i=0;i<order.menuItems.length;i++) {
						if (menuID == order.menuItems[i].id) break;
					}
					if (i==order.menuItems.length) {
						alert("error on ticket row clicked");
						return;
					}
					order.menuIndex=i;
					type = posTerminal.menuTypes[order.currentTreeNode.type];
					if (type != 'subMenu') return;
					if (order.menuItems[i].menuTree) {
						order.mode = 'Edit';
						posTerminal.posMenuTicketMenuMgr.editMenuItem(order.menuItems[i]);
					}	
				});
			this.updateTotalsFromMenuItems();
			if (this.order.comments) this.displayComments();
		},
		displayComments:		 function() {
			var html="";
			html+='<tr>';
			html+='		<td colspan="3">';
			html+='			<div style="float:left;width:38px;text-align:center;">cmt:&nbsp;</div>';
			html+='			<div style="float:left;width:280px;text-align:left;">'+ this.order.comments + '</div>';
			html+='		</td>';
			html+='</tr>';
			$('#MenuItemRows').append(html);
		},
		displayNotInMenuItem:	 function(menuItem) {
			var self = this,html='';
			var displayPrice = (menuItem.price)*menuItem.quantity;
			displayPrice = parseFloat(displayPrice).toFixed(2);
			if (displayPrice=='0.00') displayPrice = '';
			html+='<tr id = "' + menuItem.id + '" class="' + menuItem.id + ' selectable">';
			html+='		<td>' + menuItem.quantity + '</td>';
			html+='		<td>' + menuItem.product + '</td>';
			html+='		<td>' + displayPrice + '</td>';
			html+='</tr>';
			$('#MenuItemRows').append(html);
		},
		displayMenuItem:         function(menuItem){
			var self = this;
			var i,item,menuTree=menuItem.menuTree,product,subMenu,html='',price,type=posTerminal.menuTypes[menuTree.type];
			var displayPrice = (menuItem.price)*menuItem.quantity;
			displayPrice = parseFloat(displayPrice).toFixed(2);
			if (displayPrice=='0.00') displayPrice = '';
			html+='<tr id = "' + menuItem.id + '" class="' + menuItem.id + ' selectable">';
			html+='		<td>' + (type == "menuItem" ? menuItem.quantity:"") + '</td>';
			html+='		<td>' + menuItem.product + '</td>';
			html+='		<td>' + displayPrice + '</td>';
			html+='</tr>';
			for (i in menuItem.options) {
				item = menuItem.options[i];
				price = item.price?parseFloat(item.price*menuItem.quantity).toFixed(2):'';
				html+='<tr id = "' + menuItem.id + '" class="' + menuItem.id + '">';
				html+='		<td></td>';
				html+='		<td>' + item.product + '</td>';
				html+='		<td>' + price + '</td>';
				html+='</tr>';
			}
			$('#MenuItemRows').append(html);
		},
		updateTotalsFromMenuItems:function() {
			var i,j,menuItem,itemTotal=0,itemExempt,orderTax=0,subtotal = 0,itemsTotalDiscount=0,changeDue;
			for (i=0;i<this.order.menuItems.length;i++) {
				menuItem = this.order.menuItems[i];
				itemTotal = parseFloat(menuItem.price*menuItem.quantity);
				for (j in menuItem.options) {
					itemTotal+= parseFloat(menuItem.options[j].price*menuItem.quantity);
				}
				subtotal+= itemTotal;
				itemsTotalDiscount+= parseFloat(menuItem.discount);
				itemExempt=false;
				if (typeof(posTerminal.products[menuItem.productID])!='undefined') {
					if (posTerminal.products[menuItem.productID].taxable==='0') itemExempt=true;
				}
				if (!(this.order.taxExempt || itemExempt)) 
					orderTax+=(itemTotal-parseFloat(menuItem.discount))*parseFloat(posTerminal.options.tax.value);
			}
			this.order.subtotal=parseFloat(subtotal).toFixed(2);
			this.order.totalDiscount=parseFloat(this.order.orderDiscount+itemsTotalDiscount).toFixed(2);
			this.order.tax=orderTax.toFixed(2);
			this.order.total = (parseFloat(subtotal) - parseFloat(this.order.totalDiscount) + parseFloat(this.order.tax)).toFixed(2);
			changeDue = parseFloat(this.order.amountTendered) - parseFloat(this.order.total);
			if (changeDue<0) changeDue=0;
			$('#ticketSubtotal').html(parseFloat(subtotal).toFixed(2));
			$('#ticketDiscount').html(parseFloat(this.order.totalDiscount).toFixed(2));
			$('#ticketSalesTax').html(parseFloat(this.order.tax).toFixed(2));
			$('#ticketSalesTotal').html(parseFloat(this.order.total).toFixed(2));
			$('#ticketAmountTendered').html(parseFloat(this.order.amountTendered).toFixed(2));
			$('#ticketChangeDue').html(parseFloat(changeDue).toFixed(2));
		},
		deleteMenuItem: 		function(menuIndex) {
			this.order.menuItems.splice(menuIndex,1);
			this.refreshTicketDisplay();
		},
		addUpdateMenuOption: 			function(menuIndex,treeNode, option) {
			var product,id=treeNode.id,price=0,subMenu;
			var node = this.order.menuItems[menuIndex], type = posTerminal.menuTypes[treeNode.type];
			var options = node.options;
			option  = option||'';
			if (type=='optionalSelection' || type=='requiredSelection' ||
				type=='optionalSelectionMenu' || type=='requiredSelectionMenu') {
				if (treeNode.subMenu==-1) {
					product = treeNode.text;
					price   = treeNode.priceOverride!=-1?treeNode.priceOverride:0;
					option  = "No ";
				}
				else {
					subMenu = treeNode.children[treeNode.subMenu];
					if (!subMenu) {
						this.deleteMenuOption(menuIndex,treeNode,id);
						this.refreshTicketDisplay();
						return;
					}
					if (posTerminal.menuTypes[subMenu.type]=='defaultAttribute') {
						this.deleteMenuOption(menuIndex,treeNode,id);
						this.refreshTicketDisplay();
						return;
					}
					else {
						product = subMenu.text;
						if (subMenu.priceOverride!=-1) price = subMenu.priceOverride;
						else if (subMenu.productID) price = this.products[subMenu.productID].price; 
					}
				}
			}
			else {
				product = treeNode.text;
				if (treeNode.priceOverride!=-1) price =treeNode.priceOverride;
				else if (treeNode.productID) price = this.products[treeNode.productID].price;
			}
			options[id] = {subMenu:treeNode.subMenu,treeNode:treeNode,product:" * "+option+" "+product,price: parseFloat(price)};
			this.refreshTicketDisplay();
		},
		deleteMenuOption: 		function(menuIndex,treeNode, id) {
			var node = this.order.menuItems[menuIndex];
			var options = node.options;
			if (options[id]) {
				delete options[id];
				this.refreshTicketDisplay();
			}
		}
	};
		