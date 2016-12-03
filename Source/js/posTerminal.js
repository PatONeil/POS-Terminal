/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	(function ( $ ) 
	{	posTerminal.debug=true;
	// Default constants....
		posTerminal.lastOrderNumber = 0; 
		posTerminal.tillOpen = false;
		posTerminal.fullScreenMode=false;
		posTerminal.loadedPages={};
		posTerminal.messages=[];
		posTerminal.menuTypes={
			1:'subMenu',
			2:'menuItem',
			3:'optionalSelectionMenu',
			4:'requiredSelectionMenu',
			5:'optionalSelection',
			6:'requiredSelection',
			7:'optionalAttribute',
			8:'defaultAttribute'
		};
		$.ajaxSetup({ cache: posTerminal.debug?false:true });


		posTerminal.posVerifyMgrApproval=function(context, callbackFunction,parm1,parm2,parm3) {
			posTerminal.pageLoader({scripts:[['js/posVerifyMgrApproval.js','VerifyMgrApproval',[context,callbackFunction,parm1,parm2,parm3]]]});
			return;
		};
		posTerminal.openCashDrawer  = function() {
			return $.ajax({					// load Inventory...
				dataType: "json",
				url: "scripts/tillManager.php",
				data: {action:'openCashDrawer',terminalNumber:terminalNumber},
				success: function( results ) {
					if (results.Result!="OK") {
						alert("Till Manager Server Error,"+results.Message);
						return;
					}
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Till Manager: "+textStatus+"  "+errorThrown);
				}
			});
		};	
		posTerminal.logMessage =function(msg) {
			if (posTerminal.debug) $.get("scripts/logMessages.php?msg=T"+terminalNumber+": "+msg);
		}
		posTerminal.toggleFullScreen = function() {
			var elem=$('body')[0];
			if( window.innerHeight != screen.height) {
				// browser is fullscreen
				// go full-screen
				if (elem.requestFullscreen) {
					elem.requestFullscreen();
				} else if (elem.webkitRequestFullscreen) {
					elem.webkitRequestFullscreen();
				} else if (elem.mozRequestFullScreen) {
					elem.mozRequestFullScreen();
				} else if (elem.msRequestFullscreen) {
					elem.msRequestFullscreen();
				}
				$('#MainFullScreen').hide();
				posTerminal.fullScreenMode=true;
			} 
			else {
				if (document.exitFullscreen) {
					document.exitFullscreen();
				} else if (document.webkitExitFullscreen) {
					document.webkitExitFullscreen();
				} else if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else if (document.msExitFullscreen) {
					document.msExitFullscreen();
				}
				posTerminal.fullScreenMode=false;
			}	
		};
		posTerminal.findMenuItem=function(menuID,level,menuTree) {
			var i, rc,child;
			if (!level) {
				level=1;
				menuTree=posTerminal.menuTree;
			}
			if (menuTree.id==menuID) return menuTree;
			for (i in menuTree.children) {
				child = menuTree.children[i];
				rc = posTerminal.findMenuItem(menuID,level,child);
				if (rc) return rc;
			}
			return false;
		};
		
	/*----------------------------------------------------------------------------------------------------------------
		We now define our custom page loader for html, css and scripts so that it is in one place.
		It may be possible to simplify the loader and therefore its best to keep in one place.
		
		The code attempts to clean up between pages by using jquery remove to hopefully eliminate any
		event handlers on the page.   There is also a call to 'destroy' for all objects loaded for page.
	----------------------------------------------------------------------------------------------------------------*/
			
		posTerminal.pageLoader = function(list,selector,index) {
			var i,str,end;

			var loadScripts = function(list,index) {
				var str,id;
				if (index>=list.scripts.length) return;
				str = list.scripts[index];
				if (typeof(str[2])!='object') str[2]=[str[2]];
				var loaded =$("script[id='"+str[0]+"']").length;
				if (loaded) {
					if (str[1] && window['posTerminal'][str[1]] && 
					  typeof(window['posTerminal'][str[1]])=='object' && 
					  typeof(window['posTerminal'][str[1]].init)=='function') {
						window['posTerminal'][str[1]].init.apply(window['posTerminal'][str[1]],str[2]);
					}
					index++;
					loadScripts(list,index); // load next script;
				}
				else {
					var head	= document.getElementsByTagName("head")[0];
					var script	= document.createElement("script");
					var done 	= false; // Handle Script loading
					script.id   = str[0];
					script.src	= str[0]+"?t="+(new Date()).valueOf();
					script.onload = script.onreadystatechange = function() { // Attach handlers for all browsers
						if ( !done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
							done = true;
							console.log( "Load was performed for " + str[0] );
							if (str[1] && window['posTerminal'][str[1]] && 
							  typeof(window['posTerminal'][str[1]])=='object' && 
							  typeof(window['posTerminal'][str[1]].init)=='function') {
								window['posTerminal'][str[1]].init.apply(window['posTerminal'][str[1]],str[2]);
							}
							index++;
							loadScripts(list,index);
						}
					};

					head.appendChild(script);		
				}
			};
			if (!list || typeof(list)!='object') {
				alert("Not a valid list for PageLoader");
				return;
			}
			if (!selector) {  // then it's simply a load of scripts
				loadScripts(list,0);
				return;
			}
			// remove prior content of selector;
			$(selector).children().remove();
			if (list.css) { 	// start load of css first
				for (i=0;i<list.css.length;i++) {
					str = list.css[i];
					$('head').append('<link href="' + str + '" rel="stylesheet" />');
				}
			}
			if (list.html) {
				for (i=0;i<list.html.length;i++) {
					str = list.html[i];
					end = (list.html.length-1==i)?"true":"false";
					if (posTerminal.loadedPages[str]) {
						$(selector).html(posTerminal.loadedPages[str]);
						if (end) loadScripts(list,0);
					}
					else $(selector).load(str,end,function( response, status, xhr ) {
						if ( status == "error" ) {
							alert("Sorry but there was an error on " + str);
						}
						console.log( "Load was performed for " + str );
						if (end) loadScripts(list,0);
					});
				}
			}
			else loadScripts(list,0);
		};
		posTerminal.page = {};
		posTerminal.page.main = function() {
					posTerminal.pageLoader(
						{scripts:[
									['js/posMainMgr.js','posMainMgr','']
								 ],
						 html: ['pages/posMain.html']
						},
						'#posTerminal'
					);
		};		// end posTerminal.page.main;
		posTerminal.page.manager = function() {
					posTerminal.pageLoader(
						{scripts:[
									['js/posManagerMgr.js','posManagerMgr','']
								 ],
						 html: ['pages/posManager.html']
						},
						'#posTerminal'
					);
		};		// end posTerminal.page.manager;
		posTerminal.page.productMgr = function() {
					posTerminal.pageLoader(
						{scripts:[
									['js/posProductMgr.js','posProductMgr','']
								 ],
						 html: ['pages/posProductManager.html']
						},
						'#posTerminal'
					);
		};		// end posTerminal.page.productMgr;
		posTerminal.page.closeReport = function() {
					posTerminal.pageLoader(
						{scripts:[
									['js/posCloseReport.js','posCloseReport','']
								 ],
						 html: ['scripts/posCloseReport.php']
						},
						'#posTerminal'
					);
		};		// end posTerminal.page.productMgr;
		posTerminal.page.employeeMgr = function() {
					posTerminal.pageLoader(
						{scripts:[
									['js/posEmployeeMgr.js','posEmployeeMgr','']
								 ],
						 html: ['pages/posEmployeeManager.html']
						},
						'#posTerminal'
					);
		};		// end posTerminal.page.EmployeeMgr;
		posTerminal.page.customerMgr = function() {
					posTerminal.pageLoader(
						{scripts:[
									['js/posCustomerMgr.js','posCustomerMgr','']
								 ],
						 html: ['pages/posCustomerManager.html']
						},
						'#posTerminal'
					);
		};		// end posTerminal.page.customerMgr;
		posTerminal.page.addDropVendorMgr = function() {
					posTerminal.pageLoader(
						{scripts:[
									['js/posAddDropVendorEdit.js','posAddDropVendorEdit','']
								 ],
						 html: ['pages/posAddDropVendorEdit.html']
						},
						'#posTerminal'
					);
		};		// end posTerminal.page.addDropVendorMgr;
		posTerminal.page.optionsMgr = function() {
					posTerminal.pageLoader(
						{scripts:[
									['js/posOptionsMgr.js','posOptionsMgr','']
								 ],
						 html: ['pages/posOptionsManager.html']
						},
						'#posTerminal'
					);
		};		// end posTerminal.page.customerMgr;
		posTerminal.page.menuSetupMgr = function() {
					posTerminal.pageLoader(
						{scripts:[
									['js/posMenuSetupMgr.js','posMenuSetupMgr','']
								 ],
						 html: ['pages/posMenuSetupManager.html']
						},
						'#posTerminal'
					);
		};		// end posTerminal.page.menuSetupMgr;
		posTerminal.page.order = function(name,order) {
			posTerminal.pageLoader(
				{scripts:[
							['js/posMenuOrderMgr.js','posMenuOrderMgr',[name,order]]
						 ],
				 html: ['pages/posMenuOrder.html']
				},
				'#posTerminal'
			);
		};		// end posTerminal.page.order
		posTerminal.page.viewOrders = function() {
			posTerminal.pageLoader(
				{scripts:[
							['js/posViewOrdersMgr.js','posViewOrdersMgr','']
						 ],
				 html: ['pages/posViewOrderManager.html']
				},
				'#posTerminal'
			);
		};		// end posTerminal.page.viewOrders
		posTerminal.page.discountPage = function(order,discountDialog) {
			posTerminal.pageLoader({scripts:[['js/posDiscountMgr.js','posDiscountMgr',[order,discountDialog]]]});
		};
		posTerminal.page.customerSelectPage = function(order) {
			posTerminal.pageLoader({scripts:[['js/posCustomerSelectMgr.js','posCustomerSelectMgr',[order]]]});
		};
		posTerminal.page.orderParts = function() {
			posTerminal.pageLoader(
				{scripts:[
							['js/posMenuTicketMgr.js','posMenuTicketMgr','']
						 ],
				 html: ['pages/posMenuTicket.html']
				},
				'#ticketContainer'
			);
			posTerminal.pageLoader(
				{scripts:[
							['js/posMenuTicketMenuMgr.js','posMenuTicketMenuMgr','']
						 ],
				 html: ['pages/posMenuTicketMenu.html']
				},
				'#menuContainer'
			);
		};		// end posTerminal.page.orderParts
		
	/*----------------------------------------------------------------------------------------------------------------
	We now load all of the database tables into browser memory before beginning any other scripts
	This reduces the chance of timing problems of using data before it has arrived.

	It is loaded once for each startup of posTerminal,  changes to menu or products will not show 
	up in the live system until it is shut down and restarted.
	----------------------------------------------------------------------------------------------------------------*/
		posTerminal.loadProductTable  = function() {
			return $.ajax({					// load Inventory...
				dataType: "json",
				url: "scripts/productsTable.php",
				data: {action:'load'},
				success: function( results ) {
					var i,record;
					if (results.Result!="OK") {
						alert("Products Server Error,"+results.Message);
						return;
					}
					posTerminal.products={};
					for (i in results.Records) {
						record = results.Records[i];
						posTerminal.products[record.id] = record;
					}
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Products: "+textStatus+"  "+errorThrown);
				}
			});
		};	
		posTerminal.loadOptionsTable  = function() {
			return 			$.ajax({					// load options...
				dataType: "json",
				url: "scripts/optionsTable.php",
				data: {action:'load'},
				success: function( results ) {
					var i,record;
					if (results.Result!="OK") {
						alert("Options Server Error,"+results.Message);
						return;
					}
					posTerminal.options={};
					for (i in results.Records) {
						record = results.Records[i];
						posTerminal.options[record.key] = record;
					}
					},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Options: "+textStatus+"  "+errorThrown);
				}
			});
		};
		posTerminal.loadEmployeeTable = function() {
			return $.ajax({					// load Inventory...
				dataType: "json",
				url: "scripts/employeeTable.php",
				data: {action:'load'},
				success: function( results ) {
					var i,record;
					if (results.Result!="OK") {
						alert("Employee Server Error,"+results.Message);
						return;
					}
					posTerminal.employees={};
					for (i in results.Records) {
						record=results.Records[i];
						posTerminal.employees[record.id] = record;
					}
					posTerminal.empSorted = results.Records.sort(function(a,b){if (a.name==b.name) return 0;return (a.name<b.name)?-1:1});
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Employee: "+textStatus+"  "+errorThrown);
				}
			}); 
		};
		posTerminal.loadTillUsesTable = function() {
			return $.ajax({					// load till operations...
				dataType: "json",
				url: "scripts/tillUsesTable.php",
				data: {action:'load'},
				success: function( results ) {
					if (results.Result!="OK") {
						alert("Till Operation Server Error,"+results.Message);
						return;
					}
					posTerminal.tillUses=results.Records;
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Till Operation: "+textStatus+"  "+errorThrown);
				}
			});
		};
		posTerminal.getNextOrderNumber= function() {
			return $.ajax({					// get lastOrderNumber for this date...
				dataType: "json",
				url: "scripts/orderProcessor.php",
				data: {action:'getOrderNumber',terminalNumber:terminalNumber},
				success: function( results ) {
					if (results.Result!="OK") {
						alert("Last Order Number Server Error,"+results.Message);
						return;
					}
					posTerminal.lastOrderNumber=parseInt(results.lastOrderNumber);
					posTerminal.logMessage("Loaded last Order Number: "+results.lastOrderNumber);
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Last Order Number: " + textStatus+"  "+errorThrown);
				}
			}); 
		};
		posTerminal.loadCustomerTable = function() {
			return $.ajax({					// load Inventory...
				dataType: "json",
				url: "scripts/customerTable.php",
				data: {action:'load'},
				success: function( results ) {
					var i;
					if (results.Result!="OK") {
						alert("Customer Server Error,"+results.Message);
						return;
					}
					posTerminal.customers={};
					for (i in results.Records) {
						posTerminal.customers[results.Records[i].id] = results.Records[i];
					}
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Customer: "+textStatus+"  "+errorThrown);
				}
			});
		};
		posTerminal.loadmMenuTreeTable= function() {
			return $.ajax({
				dataType: "json",
				url: "scripts/menuTreeActions.php",
				data: {action:'fileLoad'},
				success: function( data ) {
					posTerminal.menuTree = data[0];
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Menu Tree:  " + textStatus+"  "+errorThrown);
				}
			});
		};
		posTerminal.autoOpenTill= function() {
			return $.ajax({
				dataType: "json",
				url: "scripts/tillManager.php",
				data: {action:'autoOpenTill',till:terminalNumber},
				success: function( results ) {
					if (results.Result=="ERROR") {
						alert("Till AutoOpen Server Error,"+results.Message);
						return;
					}
					if (results.Message) alert(results.Message);
					if (results.Result=='OK') posTerminal.tillOpen=true;
					else					  posTerminal.tillOpen=false;
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Till Auto Open: "+textStatus+"  "+errorThrown);
				}
			});
		};

		posTerminal.loadPages = function() {
			var deferred=[];
			var pages = [
				'posAddDropVendorEdit.html',
				'posCustomerManager.html',
				'posCustomerSelect.html',
				'posEmployeeManager.html',
				'posMain.html',
				'posManager.html',
				'posMenuDiscount.html',
				'posMenuOrder.html',
				'posMenuSetupManager.html',
				'posMenuTicket.html',
				'posMenuTicketMenu.html',
				'posOptionsManager.html',
				'posPayment.html',
				'posProductManager.html',
				'posViewOrderManager.html'
			];
			for (var i=0;i<pages.length;i++) {
				deferred[i] = $.ajax({
					url:'pages/'+pages[i],
					dataType: "text",
					data: {},
					success: function( data ) {
						var page = this.url.split('?')[0];
						posTerminal.loadedPages[page] = data;
						console.log("Loaded "+page);
					},
					error: function(jqXHR, textStatus, errorThrown ){
						alert("Page Loader:  " + textStatus+"  "+errorThrown);
					}
				});
			}
			return deferred;
		};
		posTerminal.loadScripts = function() {
			var deferred=[];
			var scripts = [
				'posAddDropVendorEdit.js',
				'posAddDropVendorMgr.js',
				'posCashTender.js',
				'posCloseReport.js',
				'posCloseTillMgr.js',
				'posCustomerInputMgr.js',
				'posCustomerMgr.js',
				'posCustomerSelectMgr.js',
				'posDiscountMgr.js',
				'posEmployeeMgr.js',
				'posMainMgr.js',
				'posManagerMgr.js',
				'posMenuOrderMgr.js',
				'posMenuSetupMgr.js',
				'posMenuTicketMenuMgr.js',
				'posMenuTicketMgr.js',
				'posNotInMenuMgr.js',
				'posOpenTillMgr.js',
				'posOptionsMgr.js',
				'posOrderCommentsMgr.js',
				'posPaymentMgr.js',
				'posProductMgr.js',
				'posReportMgr.js',
				'posVerifyMgrApproval.js',
				'posViewOrderDetailMgr.js',
				'posViewOrderEditMgr.js',
				'posViewOrdersMgr.js',
				'posPushMessages.js'
			];
			for (var i=0;i<scripts.length;i++) {
				deferred[i] = $.Deferred(function(deferred){
					var def = deferred;
					var src = "js/"+scripts[i];
					var head	= document.getElementsByTagName("head")[0];
					var script	= document.createElement("script");
					script.id   = src;
					script.onload = script.onreadystatechange = function() {
						def.resolve();
						console.log ("loaded "+src);
					};
					script.src	= src+(posTerminal.debug?"?t="+(new Date()).valueOf():'');
					head.appendChild(script);	
					
				})
			}
			return deferred;
		};		
		$.when.apply($,[
			posTerminal.loadProductTable(),
			posTerminal.loadOptionsTable(),
			posTerminal.loadEmployeeTable(),
			posTerminal.loadTillUsesTable(),
			posTerminal.loadCustomerTable(),
			posTerminal.loadmMenuTreeTable(),
			posTerminal.autoOpenTill()].concat(posTerminal.loadScripts(),posTerminal.loadPages())
		)			// end when...
		.then(function() {		// when tables are loaded, we can now load main page...
				// save posTerminal object in the DOM 	
				posTerminal.page.main();
				posTerminal.logMessage("POS Terminal Starting");
			});		// end then...
			
	/*----------------------------------------------------------------------------------------------------------------
	Setup screen size transforms....
	----------------------------------------------------------------------------------------------------------------*/
		posTerminal.modifyCSS = function(styleID, selector, style,value) {
			var cssRules, i, styleSheet = $('#'+styleID)[0].sheet;
			cssRules = styleSheet.cssRules||styleSheet.rules;            // Yes IE style. 
            if (cssRules) {
                for (i = 0; i < cssRules.length; i++) {
                    cssRule = cssRules[i];
                    if (cssRule) {                               // If we found a rule...
                        // console.log(cssRule);
                        if (cssRule.selectorText) {
                            if (cssRule.selectorText.toLowerCase().replace(/ /g,'') == selector.toLowerCase().replace(/ /g,'')) { //  match ruleName?
                                cssRule.style[style]=value; 
								if (posTerminal.debug) console.log("Modifying "+style+" to "+value);
	                            }
                        }
                    }
                }
            }
 		}
		// setup screen size transforms
		// cannot start in full screen mode therefore use innerWidth
		var h = ($('body').height()/768);
		var w = ($('body').width()/1024);
		posTerminal.modifyCSS("posStyles",".ui-dialog, .ui-keyboard, #posTerminal","transform",'scaleX('+w+') '+ 'scaleY(' + h +')');
	//	$('#posTerminal').css({'transform':'scaleX('+w+') '+ 'scaleY(' + h +')','transform-origin':'0 0',overflow:'hidden',margin:'0px'});
		$(window).on('resize', function(e) {
				var h = ($('body').height()/768);
				var w = ($('body').width()/1024);
				if (posTerminal.debug) console.log("in screen resize-8 setup:"+$('body').width()+":"+$('body').height()+", "+w+":"+h+", "+screen.width+":"+screen.height);
				posTerminal.modifyCSS("posStyles",".ui-dialog, .ui-keyboard, #posTerminal","transform",'scaleX('+w+') '+ 'scaleY(' + h +')');
//				$('#posTerminal').css({'transform':'scaleX('+w+') '+ 'scaleY(' + h +')','transform-origin':'0px 0px'});
			 });
		$(document).on('fullscreenchange webkitfullscreenchange mozfullscreenchange msfullscreenchange',function(e) {
			console.log("onfullscreenchange event");
			//$(window).trigger('resize');
			setTimeout(function(){$(window).trigger('resize');},100);
		});
		
	/*----------------------------------------------------------------------------------------------------------------
	Setup to limit pinch zoom on touch screens....
	https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures
	----------------------------------------------------------------------------------------------------------------*/
		posTerminal.evCache=[];
		posTerminal.prevDiff=-1;
		$('body').on('pointerdown',function(ev) {
			posTerminal.evCache.push(ev);
		});
		$('body').on('pointerup pointercancel pointerout pointerleave', function(ev) {
			for (var i = 0; i < posTerminal.evCache.length; i++) {  // remove ev from cache
				if (posTerminal.evCache[i].pointerId == ev.pointerId) {
					posTerminal.evCache.splice(i, 1);
					break;
				}
			}
			if (posTerminal.evCache.length < 2) posTerminal.prevDiff = -1;
		});
		$('body').on('pointermove', function(ev) {
			for (var i = 0; i < posTerminal.evCache.length; i++) {
				if (ev.pointerId == posTerminal.evCache[i].pointerId) {
					posTerminal.evCache[i] = ev;
					break;
				}
			}
			if (posTerminal.evCache.length == 2) {
				// Calculate the distance between the two pointers
				var curDiff = Math.abs(posTerminal.evCache[0].clientX - posTerminal.evCache[1].clientX);
				if (posTerminal.prevDiff > 0) {
					if (curDiff > posTerminal.prevDiff) {
						ev.stopPropagation();
						//console.log("pinch");
					}
					if (curDiff < posTerminal.prevDiff) {
						ev.stopPropagation();
						//console.log("pinch");
					}
				}	
				posTerminal.prevDiff = curDiff;
			}
		});
/*------------------------------------------------------------------------------------------------------------------------*/
//		try and stop window resizing....
/*------------------------------------------------------------------------------------------------------------------------*/
		$(document).ready(function(){
			$('body').css('zoom',"reset");
			$(window).bind('mousewheel DOMMouseScroll', function (event) {
				   if (event.ctrlKey == true) {
				   event.preventDefault();
				   event.stopPropagation();
				   //console.log('zoom reset');
				   }
			});
			$('#posTerminal').on('click mousewheel',function() {
				$('#posTerminal').off('click mousewheel');
				posTerminal.toggleFullScreen();
			});
		});

/*------------------------------------------------------------------------------------------------------------------------*/
//		Customized confirm dialog that utilizes jquery ui dialog for a fancier/consistent interface.
//		It replaces window alert since it defaults to an alert dialog if no OK function passed.	
/*------------------------------------------------------------------------------------------------------------------------*/
		 posTerminal.confirm = function(msg, OK_Function){
			var options = 
			{title: 'POS Terminal', 
			 position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
			 resizable: true, modal: true, maxHeight: 600, beforeClose: function(event, ui){$(this).remove();},
			 buttons: {'Cancel': 
			{text: 'Cancel', 'class': 'actionButton confirmButton', click: function(){
				$(this).dialog("close");
			}
			}, "Ok": 
			{text: 'OK', 'class': 'actionButton confirmButton', click: function(){
				$(this).dialog("close");
				try {
					OK_Function();
				}
				catch (e){
					alert('error in function.\nResults unpredictable');
				}
			}
			}}};
			if (typeof OK_Function != 'function'){
				delete options.buttons.Cancel;
				OK_Function = function(){};
			}
			$( "<div class='alertConfirm'></div>").html(msg.replace("\n", "<br>")).dialog(options);
			$('.ui-dialog-buttonpane').css({'backgroundColor': 'RGB(248,240,221)', marginTop: '0px', paddingTop: '2px', 
			   paddingBottom: '2px', borderTop: '4px ridge #5c9ccc'});
			$('.ui-dialog-titlebar-close').focus();
			//$('.alertConfirm').parent().css({zIndex:17000});
			
		};
		 window.alert = posTerminal.confirm;
/*------------------------------------------------------------------------------------------------------------------------*/
//		End Customized confirm dialog
/*------------------------------------------------------------------------------------------------------------------------*/

	}
	)(jQuery);