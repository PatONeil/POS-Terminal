/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posViewOrderEditMgr = {
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
					self.prepareOrder();
					posTerminal.page.order(self.order.employeeID,self.order);
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("ViewOrderMgr: "+textStatus+"  "+errorThrown);
				}
			});
		},
		destroy:			function() {
		},
		prepareOrder:		function() {
			// convert menu id's to menuTree references;
			var i, j, menuItem, option, newo;
			for (i in this.order) {
				if ($.isNumeric(this.order[i])) this.order[i] = parseFloat(this.order[i]);
			}
			for (i in this.order.menuItems){
				menuItem=this.order.menuItems[i];
				for (j in menuItem) {
					if ($.isNumeric(menuItem[j])) menuItem[j] = parseFloat(menuItem[j]);
				}
				menuItem.menuTree=this.findMenuTreeFromID(menuItem.menuTreeID);
				delete menuItem.menuTreeID;
				newo = {};
				for (j in menuItem.options) {
					option = menuItem.options[j];
					option.price    = parseFloat(option.price);
					option.treeNode = this.findMenuTreeFromID(option.treeNodeID);
					delete option.treeNodeID;
					newo[option.treeNode.menuID]=option;
				}
				menuItem.options=newo;
			}	
		},
		findMenuTreeFromID:	function(id,tree) {
			var i,child,rc;
			if (id===0) return {id:0};
			if (!tree) tree=posTerminal.menuTree;
			if (tree.id==id) return tree;
			for (i in tree.children) {
				child=tree.children[i];
				rc = this.findMenuTreeFromID(id,child);
				if (rc) return rc;
			}
			return 0;
		}
		
		
	};
