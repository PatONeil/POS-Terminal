/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posCloseReport = {
		init: 				function() {
			var html = '';
			//  posTerminal is global varable
			this.setupButtons();
		},
		setupButtons:		function() {
			var self = this;
			$('#clButtons').find('.actionButton').on('click',function(e){
				var button = $(e.target).text().trim();
				switch (button) {
					case 'Close Tills':
						self.closeTills();
						break;
					case 'Print':
						self.printReport();
						break;
					case 'Done':
						posTerminal.page.manager();
						break;
				} 
			});
			
		},
		closeTills:	function() {
			var till,i;
			for (i in posTerminal.options) {
				if (i.match(/^till\d(?!.)/i)) {
					this.tillClose(i);
				}
			}
		},
		tillClose:			function(till) {
			var self = this;
			var t = till.replace(/[^\d]/g,'');
			$.ajax({					// 
				dataType: "json",
				url: "scripts/tillManager.php",
				data: {action:'closeTill',till:till,amount:-parseFloat(self.tillTotals[t]),employeeID:posTerminal.mgrEmployeeID},
				success: function( results ) {
					if (results.Result=="OK") {
						posTerminal.logMessage("Till Close from Close Report for "+till+","+t);
						posTerminal.tillOpen=false;
						if (posTerminal.options["autoOpenTill"+t].value) self.tillOpen(t);
					}	
					else alert(results.Message);
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Till Close: "+textStatus+"  "+errorThrown);
				}
			});			
			
		},
		tillOpen:			function(till) {
			var self = this;
			var _till=till;
			$.ajax({
				dataType: "json",
				url: "scripts/tillManager.php",
				data: {action:'autoOpenTill',till:till},
				success: function( results ) {
					if (results.Result=="ERROR") {
						alert("Till AutoOpen Server Error,"+results.Message);
						return;
					}
//					if (results.Message) alert(results.Message);
					if (terminalNumber==till) {
						if (results.Result=='OK') {
							posTerminal.logMessage("Till Open From Close Report for "+_till+" with default amount");
							posTerminal.tillOpen=true;
						}
						else {
							posTerminal.logMessage("Till not automatically opend from Close Report for "+_till);
							posTerminal.tillOpen=false;
						}
					}
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Till Auto Open: "+textStatus+"  "+errorThrown);
				}
			});
			
		},
		printReport:		function() {
			$.ajax({					// posTillReportPrint
				dataType: "json",
				url: "scripts/posCloseReportPrint.php",
				data: {},
				success: function( results ) {
					if (results.Result!="OK") {
						alert(results.Message);
						return;
					}
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("posDailyClosePrintMgr: "+textStatus+"  "+errorThrown);
				}
			});			
		}
	};
