/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */

	posTerminal.posMenuTicketMenuMgr = {
		treeMenu:			null,
		parentNode:			null,
		order:				null,
		currentSelTarget:	'',
		init: 				function(order) {
//			debugger;
			var self = this;
			//  posTerminal is global varable
			this.order	  = posTerminal.posMenuOrderMgr.order;
			this.menuTree = posTerminal.menuTree;
			this.loadTreeMenu();
			$('#menuTable').find('td')
				.on('click',function(e){
					var item,newT,data,target=$(e.currentTarget);
					//if (e.target.nodeName!='TD') return;
					if (target.children().length==0) return; // ignore click on empty cells.
					$('#menuTable').find('td').
						css({'borderColor':'#bb8','margin':'0px',borderWidth:'1px'}).
						removeClass('selected');
					target.
						css({'borderColor':'#040','margin':'-1px',borderWidth:'2px'}).
						addClass('selected');
					item = target.find('.menu_item');
					data = item.data();
					newT = item.children(':first');
					if (item.hasClass('posDDSel')) {
						console.log('td clicked on selection menu - ignored, handled elsewhere');
						//target.find('ul').menu('widget').show();
					}
					else {
						self.menuItemClick(data,newT);
					}
				}
			);
			$('#posQuickPayButtons button').on('click',self,this.quickPay);
		},
		destroy: 			function() {
		},
		loadTreeMenu:		function() {
			this.parentNode = this.menuTree;
			this.refreshMenuFromTree(this.menuTree);
		},
		refreshMenuFromTree:function(treeNode) {
			var ndx,data,type=posTerminal.menuTypes[treeNode.type];
			// clear all menu's;
			//$('#menuTable').find('ul').menu('destroy');
			$('#menuTable').find('td').children().remove();
			$('#menuTable').find('td').
				css({'borderColor':'#bb8','margin':'0px',borderWidth:'1px'}).
				removeClass('selected');
			for (ndx in treeNode.children) {
				data = treeNode.children[ndx].data;
				this.addStandardMenuItem(treeNode.children[ndx]);
			}
			if (type=='subMenu')	{
				if (treeNode.id=="top")	$('#ticketDone').html('Order<br>Complete');
				else 					$('#ticketDone').html('Main<br>Menu');
			}
			if (type=='menuItem' && treeNode.children.length) {
				$('#ticketDone').html('Item<br>Complete');
			}
			if (type=='subMenu'||type=='menuItem')
				this.order.currentTreeNode = treeNode;
			if (type=='optionalSelectionMenu'||type=='requiredSelectionMenu')
				this.order.selectionTreeNode = treeNode;
		},
		menuItemComplete:	function() {
			var ndx,data,type,treeNode = this.order.currentTreeNode;
			for (ndx in treeNode.children) {
				data = treeNode.children[ndx];
				type = posTerminal.menuTypes[data.type];
				if (type=='requiredSelection' && data.subMenu==-1) return false;
			}
			return true;
		},
		editMenuItem:		function(menuItem) {
			var i,item,cell,data,menuTree = menuItem.menuTree;
			this.order.currentTreeNode = menuTree;
			this.order.mode='Edit';
			if (this.order.mode2=='Edit') 
				$('#modeOfTicket div').html("Mode<br>Edit Order/Item").addClass("css_blink");
			else
				$('#modeOfTicket div').html("Mode<br>Edit Item").addClass("css_blink");
			if (!menuTree.id) {
				posTerminal.pageLoader({scripts:[['js/posNotInMenuMgr.js','posNotInMenuMgr',[menuItem]]]});
				return;
			}
			$('#ticketDone').html('Item<br>Edit<br>Complete');
			this.refreshMenuFromTree(menuTree);
			for (i in menuItem.options) {
				treeNode = menuItem.options[i].treeNode;
				cell = $("#Cell-"+treeNode.row+"-"+treeNode.col+'-menu :first-child');
				switch (posTerminal.menuTypes[treeNode.type]) {
					case 'requiredSelection':
					case 'optionalSelection':
						cell.val(treeNode.subMenu);
						break;
					case 'defaultAttribute':
						cell.text("No "+treeNode.text);
						break;
					case 'optionalAttribute':
						cell.text(treeNode.text);
						break;
				}
			}
		},
		endEditMenuItem:	function() {
			var s='Normal';
			//$('#ticketMenuTopContainer').children().remove();
			this.order.mode='Normal';
			if (this.order.mode2=='Edit')
 				$('#modeOfTicket div').html("Mode<br>Edit Order").addClass("css_blink");
			else
 				$('#modeOfTicket div').html("Mode<br>Normal").removeClass("css_blink");

			this.order.menuIndex = this.order.menuItems.length!==0?this.order.menuItems.length-1:0;
			this.refreshMenuFromTree(this.menuTree);
		},
		prepareSelection:	function(treeNode,id,mClass) {
			var i,node,type,nodes,caption='',hasDefaultSelection=false,rows,cols=1,cnt,s='',h="",left=-3;
			nodes={}; // set up to sort in row,col order
			for (i=0;i<treeNode.children.length;i++) {
				node = treeNode.children[i];
				treeNode.children[i].ndx = i;
				nodes[node.row+node.col*8]=treeNode.children[i];
			}
			for (i in nodes) {
				node = nodes[i];
				type = posTerminal.menuTypes[node.type];
				if (type=='defaultAttribute') {
					hasDefaultSelection=true;
					caption = node.text;
					//treeNode.children[node.ndx].data.subMenu = i;
					treeNode.subMenu = node.ndx;
				}
				s+='<div class="' + mClass + ' posDDSel" style="float:left;margin:3px 2px;" data-value="' + node.ndx + '" >';
				s+='	<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
				s+=			node.text;
				s+='	</div>';
				s+='</div>';

				}
			type = posTerminal.menuTypes[treeNode.type];
			if (!hasDefaultSelection && type=="optionalSelection") caption = 'No ' + treeNode.text;
			if (!hasDefaultSelection || type=="optionalSelection") {
				s+='<div class="' + mClass + ' posDDSel" style="margin:3px 0px;"  data-value="-1" >';
				s+='	<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
				s+=			'No ' + treeNode.text;
				s+='	</div>';
				s+='</div>';
			}
			cnt = treeNode.children.length + (!hasDefaultSelection && type=="optionalSelection"?1:0);
			i = Math.ceil(Math.sqrt(cnt));
			if (cnt<=8-treeNode.row) rows=cnt;
			else if (Math.ceil(cnt/2)<=8-treeNode.row) {
				rows = Math.ceil(cnt/2);
				cols = 2;
			}
			else if (i<=8-treeNode.row && i<=4) {
				rows= i;
				cols = i;
			}
			else {
				rows = 8-treeNode.row;
				cols = Math.ceil(cnt/rows);
			}
			if 		(treeNode.col==5 && cols>1) left -= (cols-1)*132;
			else if	(treeNode.col==4 && cols>2) left -= (cols-2)*132;
			else if (treeNode.col==3 && cols>3) left -= (cols-3)*132;
			else if (treeNode.col==2 && cols>4) left -= (cols-4)*132;
			h+='<div id="'+id+'-ul" style="margin-left:'+left+'px;padding:0px 5px;background-color:white;float:left;width:'+(cols*134)+'px;border:3px ridge lightgray;z-index:2;display:none;position:absolute;">';
			h+='	<div style="width:100%;color:black;text-align:center;font-size:15px;padding:2px 0px;">Enter Selection</hr></div>';
			h+=s;
			h += '</div>';
			return {html:h,caption:caption};
		},
		addStandardMenuItem:function(treeNode) {
			if (treeNode.active=="0") return;
			var button,i,id,selected,results, selMenu;
			var self=this,ul='',node,hasDefaultSelection=false;
			var caption = treeNode.text,type=posTerminal.menuTypes[treeNode.type],
				positionID="Cell-"+treeNode.row+"-"+treeNode.col;
			var mClass ='menu_item '+type+ ' ';
			$("#"+positionID).children().remove(); 			// belts and suspenders.
			id = positionID+"-menu";
			switch(type) {
				case "subMenu":
					mClass+="posSubMenuButton";
					break;
				case "menuItem":
					mClass+="posMenuItemButton";
					break;
				case "optionalSelectionMenu":
					mClass+="posOptionalSelectionButton";
					break;
				case "requiredSelectionMenu":
					mClass+="posRequiredSelectionButton";
					break;
				case "optionalSelection":
					mClass+="posOptionalSelectionButton";
					break;
				case "requiredSelection":
					mClass+="posRequiredSelectionButton";
					break;
				case "defaultAttribute":
					if (this.order.menuItems[this.order.menuIndex].options[treeNode.id]) 
						 caption=caption;
					else caption='No '+caption;			
					mClass+="posDefaultAttributeButton";
					break;
				case "optionalAttribute":
					if (this.order.menuItems[this.order.menuIndex].options[treeNode.id]) 
						 caption='No '+caption;
					else caption=caption;			
					mClass+="posOptionalAttributeButton";
					break;
			}
			if (type=="optionalSelection" || type=="requiredSelection") {
				treeNode.subMenu  = -1;
				results = self.prepareSelection(treeNode,id,mClass);
				selMenu=results.html;
				if (results.caption) caption = results.caption;
			}
			button = $('<div class="' + mClass + '" id="' + id + '">'+
								'<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">'+
									caption+
								'</div>'+
							'</div>'
						 );
			$("#"+positionID)
				.append(button);
			$("#"+id).data(treeNode);
			if (type=="optionalSelection" || type=="requiredSelection") {
				$("#"+id).append(selMenu);
				$('#'+positionID).on('click',self,
					function(e){
						var target=$(e.target);
						console.log("Entered onCLick for positionID");
						var id = "#"+positionID+'-menu-ul',self=e.data; 
						if (target.hasClass('posDDSel')||target.parent().hasClass('posDDSel')) return;
						if( $(id).is(':visible') ) return;  // click on menu selector
						console.log("Entered onCLick for for selection menu item");
						if (self.currentSelTarget) {
							$(self.currentSelTarget).hide();
						}
						self.currentSelTarget=id;
						$(id).css({
								 display:'block',
								 marginTop: (55-$('#'+positionID+'-menu div').outerHeight(true))+'px'
								 //left:$('#'+positionID+'-menu').offset().left,
								 //top: $('#'+positionID+'-menu').offset().top+$('#'+positionID+'-menu').height()-12
							 });
						$(id).children('.posDDSel').on('mousedown click',self,function(e){
							console.log("Entered click for div Elements");
							if (!self.currentSelTarget) return;		// entered without currentSel
							console.log("Entered click for div Elements-with currentSel");
							var div = $(e.delegateTarget), ndx  = div.data('value'), ul_id = div.parent().attr('id');
							var did = ul_id.substr(0,ul_id.length-3);//, treeNode = $('#'+did).data();
							$(self.currentSelTarget).css('display','none');
							self.currentSelTarget='';
							$(document).off('click.menuMgr');
							treeNode.subMenu = ndx;
							self.menuItemClick(treeNode,$('#'+did).children(':first-child'));
							console.log(e.target.innerHTML+' clicked');
							e.stopPropagation();
							$('#'+ul_id).children('.posDDSel').off('mousedown click');
							
						});
						$('#posTerminal').on('click.menuMgr',self,function(e) {
							console.log("Entered onCLick for document");
							$('#posTerminal').off('click.menuMgr');
							$(self.currentSelTarget).css('display','none');
							self.currentSelTarget='';
						});
						e.stopPropagation();
					});
			}
		},
		menuItemClick:			function(treeNode,target) {
			var type = posTerminal.menuTypes[treeNode.type];
			var data, i, menuID, selTree;
			switch (type) {
				case 'subMenu':
					this.refreshMenuFromTree(treeNode);
					break;
				case 'menuItem':
					posTerminal.posMenuTicketMgr.addMenuItem(treeNode);
					if (treeNode.children.length==0) break;
					else this.refreshMenuFromTree(treeNode);
					break;
				case 'optionalSelectionMenu':
				case 'requiredSelectionMenu':
					if (treeNode.children.length) {
						this.refreshMenuFromTree(treeNode);
					}
					break;
				case 'optionalSelection':
				case 'requiredSelection':
					posTerminal.posMenuTicketMgr.addUpdateMenuOption(this.order.menuIndex,treeNode, "");
					if (treeNode.subMenu==-1) target.text(treeNode.text);
					else 						   target.text(treeNode.children[treeNode.subMenu].text);
					break;
				case 'defaultAttribute':
					if (this.order.selectionTreeNode) {
						selTree = this.order.selectionTreeNode;
						this.order.selectionTreeNode=null;
						this.refreshMenuFromTree(this.order.currentTreeNode);
						// find index in selTree;
						for (i=0;i<selTree.children.length;i++) if (selTree.children[i].id==treeNode.id) break;
						selTree.subMenu = i;
						posTerminal.posMenuTicketMgr.addUpdateMenuOption(this.order.menuIndex,selTree, "");
						target = $("#Cell-"+selTree.row+"-"+selTree.col+"-menu div");
						target.text(treeNode.text);
						return;
					}
					if (this.order.menuItems[this.order.menuIndex].options[treeNode.id]) {
						posTerminal.posMenuTicketMgr.deleteMenuOption(this.order.menuIndex,treeNode,treeNode.id);
						target.text(treeNode.text);
					}
					else {
						posTerminal.posMenuTicketMgr.addUpdateMenuOption(this.order.menuIndex,treeNode, "No ");
						target.text(treeNode.text);
					}	
					break;
				case 'optionalAttribute':
					if (this.order.selectionTreeNode) {
						selTree = this.order.selectionTreeNode;
						this.order.selectionTreeNode=null;
						this.refreshMenuFromTree(this.order.currentTreeNode);
						// find index in selTree;
						for (i=0;i<selTree.children.length;i++) if (selTree.children[i].id==treeNode.id) break;
						selTree.subMenu = i;
						posTerminal.posMenuTicketMgr.addUpdateMenuOption(this.order.menuIndex,selTree, "");
						target = $("#Cell-"+selTree.row+"-"+selTree.col+"-menu div");
						target.text(treeNode.text);
						return;
					}
					if (!this.order.menuItems[this.order.menuIndex].options[treeNode.id]) {
						posTerminal.posMenuTicketMgr.addUpdateMenuOption(this.order.menuIndex,treeNode, "");
						target.text("No " + treeNode.text);
					}
					else {
						posTerminal.posMenuTicketMgr.deleteMenuOption(this.order.menuIndex,treeNode,treeNode.id);
						target.text(treeNode.text);
					}	
					break;
					
			}
		},
		quickPay:		function(e) {
			var self = e.data,total = parseFloat(self.order.total),pre_tend=parseFloat(self.order.amountTendered);
			var button = $(e.target).val();
			self.order.creditCardPayment=0;
			self.order.giftCertificatePayment=0;
			self.order.corporateCharge=0;
			self.order.houseAccountCharge=0;
			switch(button) {
				case '1':
				case '2':
				case '5':
				case '10':
				case '20':
					self.order.creditCardPayment=0;
					self.order.amountTendered = pre_tend+parseFloat(button);
					self.order.cashPayment= self.order.amountTendered>=total?total:self.order.amountTendered;
					break;
				case 'Exact Cash': 
					self.order.cashPayment=self.order.amountTendered = total;
					self.order.creditCardPayment=0;
					break;
				case 'Charge':
					self.order.creditCardPayment=self.order.amountTendered = total;
					self.order.cashPayment=0;
					break;
				case 'Clear':
					self.order.cashPayment=0;
					self.order.checkPayment=0;
					self.order.amountTendered = 0;
					break;
			}
			posTerminal.posMenuTicketMgr.updateTotalsFromMenuItems();
		}
	};

