/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posManagerMgr = {
		init: 			function(employee) {
			//  posTerminal is global varable
			this.setupButtons();
		},
		destroy:			function() {
		},
		setupButtons:		function() {
			var self = this;
			$('#posManagerMain .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case "Toggle Full Screen":
						posTerminal.toggleFullScreen();
						break;
					case "Return to POS":
						$('#posManagerMain .actionButton').off('click');  // should not be needed but...
						posTerminal.page.main();
						break;
					case "Edit Tracking Products":
						$('#posManagerMain .actionButton').off('click');  // should not be needed but...
						posTerminal.page.productMgr();
						break;
					case "Edit Employees":
						$('#posManagerMain .actionButton').off('click');  // should not be needed but...
						posTerminal.page.employeeMgr();
						break;
					case "Edit Customers":
						$('#posManagerMain .actionButton').off('click');  // should not be needed but...
						posTerminal.page.customerMgr();
						break;
					case "Edit Drop/Add/Vendors":
						$('#posManagerMain .actionButton').off('click');  // should not be needed but...
						posTerminal.page.addDropVendorMgr();
						break;
					case "Open Till":
						posTerminal.pageLoader(		// just a dialog...
							{scripts:[
										['js/posOpenTillMgr.js','posOpenTillMgr','']
									 ]
							});
						break;
					case "Close Till":
						posTerminal.pageLoader(		// just a dialog...
							{scripts:[
										['js/posCloseTillMgr.js','posCloseTillMgr','']
									 ]
							});
						break;
					case "Daily Close":
						$('#posManagerMain .actionButton').off('click');  // should not be needed but...
						posTerminal.page.closeReport();
						break;
					case "Reports":
						posTerminal.pageLoader(		// just a dialog...
							{scripts:[
										['js/posReportMgr.js','posReportMgr','']
									 ]
							});
						break;
					case "Edit Menu":
						$('#posManagerMain .actionButton').off('click');  // should not be needed but...
						posTerminal.page.menuSetupMgr();
						break;
					case "Edit Options":
						$('#posManagerMain .actionButton').off('click');  // should not be needed but...
						posTerminal.page.optionsMgr();
						break;
					case "Open Cash Drawer":
						posTerminal.openCashDrawer();
						break;
					default:
						alert(button+' pushed');
						break;
				}
			});
		}
	};
