/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posMenuSetupMgr = {
		copyTreeNode:		null,
		touchtime:			0,
		lastMenuID:			(new Date()).valueOf(),
		init: 			function() {
			//  posTerminal is global varable
			this.setup();
		},
		destroy:			function() {
		},
		copyTreeElements:	function(copyTreeNodeID,currentTreeNodeID) {
			var i, child,id,children=[],cell,menuData;
			var model = $('#jstree').jstree(true)._model.data;
			var copyTreeNode = model[copyTreeNodeID];
			if (copyTreeNodeID==currentTreeNodeID) {
				alert("Cannot paste to the same area as copy!!!");
				return;
			}
			if (copyTreeNode.children.length==0) return;
//			console.log("Copying from "+copyTreeNodeID+" to "+currentTreeNodeID);
			//var currentTreeNode = model[currentTreeNodeID];
			$('#jstree').jstree("deselect_all");
			$('#jstree').jstree(true).select_node(currentTreeNodeID);
			this.refreshMenuFromTree(model[currentTreeNodeID],model);
			for (i in copyTreeNode.children) {
				child = $.extend(true,{},model[copyTreeNode.children[i]]);
				menuData = $.extend(true,{},child);
				cell = "Cell-"+menuData.data.row+"-"+menuData.data.col;
				if ($('#'+cell).children().length==0) {
//					console.log("copying menuItem caption="+data.text+", parent="+data.parent);
					id=this.addMenuItem(child.text,currentTreeNodeID,-1,menuData.data.type,menuData.data,cell,false,true);
					children.push({child:child,id:id});
				}
			}
			for (i in children) {
				if (children[i].child.children.length==0)continue;
				this.copyTreeElements(children[i].child.id,children[i].id);
			}
		},
		setup:		function() {
			var self = this,model,currentID;
			$('#posMenuSetupButtons .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case "Done":
						$('#jstree').children().remove();
						$('#menuTable').find('td').children().remove();
						$('#jstree').html('<h1 style="margin:100px 80px;">Rebuilding Menu</h1><img src="css/images/loading_large.gif" class="centered" />');
						$.ajax({
							dataType: "text",
							url: "scripts/menuTreeActions.php",
							data: {action:'load',file:true},
							success: function( data ) {
								$.when(posTerminal.loadmMenuTreeTable()).then(posTerminal.page.manager);
							},
							error: function(jqXHR, textStatus, errorThrown ){
								alert(textStatus+"  "+errorThrown);
							}
						});	
						break;
					case "Copy":
						model = $('#jstree').jstree(true)._model.data;
						self.copyTreeNode = model[$('#jstree').jstree('get_selected')[0]];
						break;
					case "Paste":
						if (!self.copyTreeNode) {
							alert("Node must be selected before paste!");
							return;
						}
						model = $('#jstree').jstree(true)._model.data;
						currentID = model[$('#jstree').jstree('get_selected')[0]].id;
						self.copyTreeElements(self.copyTreeNode.id,model[$('#jstree').jstree('get_selected')[0]].id,true);
						$('#jstree').jstree(true).select_node(currentID);
						break;
					default:
						alert(button+' pushed in posMenuSetupMgr');
						break;
				}
			});
			this.loadProducts();
			this.loadTreeMenu();
			$('#menuTable').find('td')
				.on('click',self, function(e){
					var self=e.data,data;
					if (e.target.nodeName!='TD') return;
					if(self.touchtime == 0 || ((new Date().getTime())-self.touchtime) > 800) {
						//set first click
						self.touchtime = new Date().getTime();
						$('#menuTable').find('td').
							css({'borderColor':'#bb8','margin':'0px',borderWidth:'1px'}).
							removeClass('selected');
						$(e.target).
							css({'borderColor':'#040','margin':'-1px',borderWidth:'2px'}).
							addClass('selected');
						if (!$(e.target).children().length) self.menuInputRefresh();	
					} 
					else {
						//double click occurred
						self.touchtime = 0;
						if ($(e.target).length!=0) {
							data = $(e.target).find('div').data();
							if (data && 
								(data.type=='subMenu' || data.type=='requiredSelection' || data.type=='optionalSelection')
							   ) {
									$('#jstree').jstree("deselect_all");
									$('#jstree').jstree(true).select_node(data.id);
								}
						}
					} 
				})
				.droppable(	{
					//snap:true,
					tolerance: 'touch',
					//snapMode: "inner",
					drop:function(e,ui){self.menuDrop(e,ui);}
				});
			$("#menuOptionButtons button").on('click',self,self.menuOptionButtons);	
		},
		loadProducts:		 function() {
			var products  = posTerminal.products;
			var product, i,s='';
			s+="<option value='0'>No Product</option>";
			for (i in products) {
				product = products[i];
				s+="<option value='"+product.id+"'>"+product.longText+"</option>";
			}		
			$('#menuInputProductID').html(s);
		},
		updateMenuData:     function(data) {
			data.data = {productID:data.productID,row:data.row,col:data.col,type:data.type,
						 active:data.active,online:data.online,priceOverride:data.priceOverride};
			for (var i in data.children) this.updateMenuData(data.children[i])
		},
		loadTreeMenu:		function() {
			var self = this;
			$.ajax({
				dataType: "json",
				url: "scripts/menuTreeActions.php",
				data: {action:'fileLoad'},
				success: function( data ) {
					self.updateMenuData(data[0]);
					$('#jstree').children().remove();
					$('#jstree').jstree({
						core:{'check_callback' : true,
							  data:data,
							  multiple:false,
							  worker:false,
							  animation:false
							}
					});
					
					// bind to events triggered on the tree
					$('#jstree').on("select_node.jstree", function (e, data) {
					  if (data.instance._data.core.last_clicked&&
						  data.instance._data.core.last_clicked.id==data.selected) return;  // clicked it already
					  if (data.node.data.type=='defaultAttribute') return;
					  if (data.node.data.type=='optionalAttribute') return;
					  // console.log(data.selected);
					  self.refreshMenuFromTree(data.node,data.instance._model.data);
					});
					setTimeout(function(){$('#jstree').jstree(true).select_node('top');},500);
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert(textStatus+"  "+errorThrown);
				}
			});	
		},
		updateDatabase:		function(type,treeData) {
			var postData = $.extend({action:type},treeData);
			var postData = $.extend(postData,treeData.data);
			delete postData.data;
			//postData =JSON.stringify(postData);
			$.ajax({
				type: "POST",
				data: postData,
				url: "scripts/menuTreeActions.php",
				success: function(data, code, promise){
						if (promise.responseText.trim()!="OK") {
							alert(promise.responseText);
						}
					},	
				error: function(jqXHR, textStatus, errorThrown ){
					alert(textStatus+"  "+errorThrown);
				}
			});
		},
		refreshMenuFromTree:function(treeNode,model) {
			var ndx,treeData;
			// clear all menu's;
			$('#menuTable').find('td').children().remove();
			$('#menuTable').find('td').
				droppable('enable').
				css({'borderColor':'#bb8','margin':'0px',borderWidth:'1px'}).
				removeClass('selected').
				addClass('droppable');
			for (ndx in treeNode.children) {
				treeData = model[treeNode.children[ndx]];
				this.addMenuItem(treeData.text,treeData.parent,treeData.id,posTerminal.menuTypes[treeData.data.type],
							     treeData.data,"Cell-"+treeData.data.row+"-"+treeData.data.col,true);
			}
			this.menuInputRefresh();
		},
		validMenuInput:		function(menuInput) {
			// edit input form for valid data and issue messages
//			menuInput.priceOverride($.trim(menuInput.priceOverride));
//			if (menuInput.priceOverride.test(/[/d\+\-]*})
//			if (!$.isNumeric(menuInput.priceOverride)) {
//				alert("Price Override must be numeric!!");
//				return false;
//			}
			return true;
		},
		menuInputRefresh:	function(menuData) {
			if (!menuData) { // open position in menu layout
				menuData = {text:'',data:{type:'',product:-1,active:1,online:1,priceOverride:-1}};
			}
			$('#menuInputType').val(menuData.data.type);
			$('#menuInputCaption').val(menuData.text);
			$('#menuInputProductID').val(menuData.data.productID);
			$('#menuInputActive').prop('checked', menuData.data.active=="1"?true:false);
			$('#menuInputOnline').prop('checked', menuData.data.online=="1"?true:false);
			$('#menuInputPrice').val(menuData.data.priceOverride);
		},
		checkForDuplicateDefaultItems: function(treeData,modelData,type) {
			var i,item, rc=false;
			var tdata = $('#jstree').jstree(true)._model.data;
			var treeType = posTerminal.menuTypes[treeData.data.type];
			if (!(treeType=='optionalSelectionMenu'||
				  treeType=='requiredSelectionMenu'||
				  treeType=='optionalSelection'||
				  treeType=='requiredSelection')) return false;
			for (i in treeData.children) {
				item = tdata[treeData.children[i]];
				if (item.data.type=='defaultAttribute') {
					if (type=='add') rc=true;
					else if (item.id==modelData.id) continue;
					rc = true;
				}
			}
			if (rc) {
				alert("Cannot have duplicate default items in selections.");
			}
			return false;
		},
		menuOptionButtons:	function(e) {
			var self = e.data;
			var buttonType = $(e.target).val();
			var menuInput = {
				type:			$('#menuInputType').val(),
				text:			$('#menuInputCaption').val(),
				productID:		$('#menuInputProductID').val(),
				active:			$('#menuInputActive').is(':checked')?"1":"0",
				online:			$('#menuInputonline').is(':checked')?"1":"0",
				priceOverride:	$('#menuInputPrice').val()
				};
			if (!self.validMenuInput(menuInput)) return;
			var menuCell = $("#menuTable td.selected");
			var menuContent = $("#menuTable td.selected :first-child");
			var menuData = menuContent.data(),newD={};
			var treeData = $('#jstree').jstree().get_selected(true)[0];
			var treeType = posTerminal.menuTypes[treeData.data.type];
			var menuType = posTerminal.menuTypes[menuInput.type];
			if (menuInput.type=='defaultAttribute' && 
				self.checkForDuplicateDefaultItems(treeData,menuData,buttonType)) return;
			switch (buttonType) {
				case 'add':
					if (menuCell.children().length) {
						alert("Cell must be empty to add menu item");
						return;
					}
					if (treeType=='subMenu'&& !(menuType=='subMenu'||
						menuType=='menuItem'||menuType=='optionalSelectionMenu'||
						menuType=='requiredSelectionMenu')) {		
						alert("Parent menu is submenu, therefore new menu item type must be either submenu or menuitem");
						return;
					}
					self.addMenuItem(menuInput.text,treeData.id,-1,menuType,menuInput,menuCell.attr('id'));
					break;
				case 'update':	
					if (!menuCell.children().length) {
						alert("Cell must contain menu item");
						return;
					}
					newD.id			= menuData.id;
					newD['parent']	= treeData.id;
					newD.text 	    = menuInput.text;
					newD.data		= [];
					newD.data.row	= menuData.data.row;
					newD.data.col	= menuData.data.col;
					newD.data.type 	= menuInput.type;
					newD.data.productID = menuInput.productID;
					newD.data.active	= menuInput.active;
					newD.data.online	= menuInput.online;
					newD.data.priceOverride = menuInput.priceOverride;
					self.updateDatabase('update',newD);
					menuContent
						.data(newD)
						.find('div').text(menuInput.text);
					$('#jstree').jstree('rename_node', newD.id, menuInput.text);
					$('#jstree').jstree(true)._model.data[newD.id].data=newD;
					self.addMenuItem(menuInput.text,treeData['parent'],menuData.id,menuType,newD.data,menuCell.attr('id'),true);
					return;
				case 'delete':	
					if (!menuCell.children().length) {
						alert("Cell must contain menu item");
						return;
					}
					self.deleteMenuItem(menuContent);
					return;
			}
		},
		menuDrop:			function(e,ui) {
			var self = this;
			if ($.isEmptyObject(ui.draggable.data())) {
				// console.log("menuDrop without data object;");
//				debugger;
				return;
			}
			else {
				// console.log("menuDrop of "+ui.draggable.data().text);
				// console.log("menuDrop of "+e.target.id);
			}	
			// get target cell
			var target = $(e.target);
			// get drop division
			var drag   = ui.draggable;
			var menuData   = drag.data();
			var comp = target.attr('id').split('-');
			var tdata= $('#jstree').jstree(true)._model.data[menuData.id];
			tdata.data.row=comp[1];tdata.data.col=comp[2];
			drag.parent('td').addClass('droppable').droppable('enable');
			drag.remove();
			self.updateDatabase('update',tdata);
			
			self.addMenuItem(tdata.text,tdata['parent'], tdata.id,posTerminal.menuTypes[tdata.data.type],tdata.data,target.attr('id'),true);
		},
		deleteMenuChildren:		function(children) {
			var i,child;
			var model = $('#jstree').jstree(true)._model.data;
			for (i in children) {
				child = children[i];
				this.updateDatabase('delete',child);
				if (model[child].children.length!=0) {
					this.deleteMenuChildren(model[child].children);
				}
			}
		},
		deleteMenuItem:		function($element) {
			var data = $element.data();
			var model = $('#jstree').jstree(true)._model.data;
			$element.parent('td').addClass('droppable').droppable('enable');
			$element.remove();
			this.updateDatabase('delete',data);
			this.deleteMenuChildren(model[data.id].children);
			$('#jstree').jstree('delete_node','#'+data.id);
		},
		addMenuItem:		function(caption, parentID, currentID, type,data,positionID, withoutTreeUpdate,inCopyMode) {
			var self=this,button,selNode,components,id,mClass='menuItem '+type+ ' ';
			var treeData = {id:currentID,text:caption,'parent':parentID, data:data};
			if (typeof inCopyMode == 'undefined') inCopyMode=false;
			if (!positionID) {
				positionID=$('#menuTable').find('td:empty:first').attr('id');
			}
			if (inCopyMode) {
				treeData.id=this.lastMenuID++;				// simple way to generate unique ID
			}
			if (withoutTreeUpdate!==true && !inCopyMode) {
				data.parent = $('#jstree').jstree('get_selected')[0];
				components = positionID.split('-');
				treeData.data.row=components[1];
				treeData.data.col=components[2];
				treeData.id=this.lastMenuID++;				// simple way to generate unique ID
			}
			$("#"+positionID).children().remove(); 			// belts and suspenders.
			id = positionID+"-menu";
			switch(type) {
				case "subMenu":
					mClass+="posSubMenuButton";
					break;
				case "menuItem":
					mClass+="posMenuItemButton";
					break;
				case "requiredSelectionMenu":
					mClass+="posRequiredSelectionButton";
					break;
				case "optionalSelectionMenu":
					mClass+="posOptionalSelectionButton";
					break;
				case "requiredSelection":
					mClass+="posRequiredSelectionButton";
					break;
				case "optionalSelection":
					mClass+="posOptionalSelectionButton";
					break;
				case "defaultAttribute":
					mClass+="posDefaultAttributeButton";
					break;
				case "optionalAttribute":
					mClass+="posOptionalAttributeButton";
					break;
			}
			button = $('<div class="' + mClass + '" id="' + id + '">'+
								'<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">'+
									caption+
								'</div>'+
							'</div>'
						 );
			$("#"+positionID)
				.removeClass('droppable')
				.droppable('disable')
				.append(button);
			$("#"+id)
				.data(treeData)
				.addClass('draggable')
				.draggable({
					//snap:true,
					//snapMode: "inner",
					//drop:menuDrop,
					//snapTolerance: 30,
					revert:true
				})
				.on('click',function(e){
					$(e.target).parents('td').trigger( "click" );
					self.menuInputRefresh($(e.target).data());
					e.stopPropagation();
				});
			$("#"+id).find('div')
				.on('click',function(e){
					$(e.target).parents('td').trigger( "click" );
					self.menuInputRefresh($(e.target).parents('div:first').data());
					e.stopPropagation();
				});
			if (withoutTreeUpdate===true) return data.id;	
			$("#"+positionID).trigger('click');
			console.log("Adding item caption="+caption+", id="+data.id+", parent="+data.parent);
			$('#jstree').jstree(
				'create_node',
				parentID,
				{	id          : treeData.id, // will be autogenerated if omitted
					text        : caption, // node text
					data		: data,
					state       : {
						opened    : true,  // is the node open
						selected  : false  // is the node selected
					}
				  },
				  'last',
				  false,
				  false
			);
			this.updateDatabase('create',treeData);
			return treeData.id;
		}	
		
	};
