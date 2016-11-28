/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posMainMgr = {
		init: 			function(employee) {
			//  posTerminal is global varable
			$('#posTerminalHeader').html(posTerminal.options.company.value);
			this.addEmployees();
			this.setupButtons();
			posTerminal.posPushMessages.displayMessages();
		},
		destroy:			function() {
		},
		addEmployees:		function() {
			//debugger;
			var self = this, clr, br,emp=[];
			var i,html='',name,employee,employees = posTerminal.empSorted;
			br = Math.min(Math.ceil(employees.length/2.0),5);
			for (i in employees) {
				employee=employees[i];
				if (!employee.active) continue;
				name = employee.name;
				if (i%br == 0) html+='<br>';
				html+= 
					'	<div id="MainEmployee_'+employee.id+'" class="employeeButton" style="'+clr+'width:120px; margin:10px 20px; margin-top:0px; text-align:center:height:60px;">'+
					'		<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">'+
								name+
					'		</div>'+
					'	</div>';	
			}
			$('#mainEmployeeOrder').html(html);
			$('#mainEmployeeOrder .employeeButton').on('click',self,function(e) {
				if (!posTerminal.tillOpen) {
					alert('Till must be opened before orders entered');
					return;
				}
				var employees = posTerminal.employees;
				var arr,name,id,element = $(e.target);
				if (element.hasClass('employeeButton')) {
					id = element.attr('id');
				} else {
					id = element.parent().attr('id');
				}
				if (!id) debugger;
				arr = id.split('_');
				if (!arr[1]) debugger;
				// get next order number
				$.when(posTerminal.getNextOrderNumber()
				).then(function() {
					posTerminal.page.order(arr[1],false);
				});
			});
		},
		setupButtons:		function() {
			var self = this;
			$('#MainTestCode').on('click',self,function(e) {
				posTerminal.pageLoader(		// just a dialog...
					{scripts:[
								['js/posNotInMenuMgr.js','posNotInMenuMgr','']
							 ]
					});
			});
			$('#MainViewOrders').on('click',self,function(e) {
				var self = e.data;
				posTerminal.page.viewOrders();
			});
			$('#MainCashAdd').on('click',self,function(e) {
				posTerminal.pageLoader(		// just a dialog...
					{scripts:[
								['js/posAddDropVendorMgr.js','posAddDropVendorMgr','add']
							 ]
					});
			});
			$('#MainCashDrop').on('click',self,function(e) {
				posTerminal.pageLoader(		// just a dialog...
					{scripts:[
								['js/posAddDropVendorMgr.js','posAddDropVendorMgr','drop']
							 ]
					});
			});
			$('#MainCashVendor').on('click',self,function(e) {
				posTerminal.pageLoader(		// just a dialog...
					{scripts:[
								['js/posAddDropVendorMgr.js','posAddDropVendorMgr','vendor']
							 ]
					});
			});
			$('#MainVendorRefund').on('click',self,function(e) {
				posTerminal.pageLoader(		// just a dialog...
					{scripts:[
								['js/posAddDropVendorMgr.js','posAddDropVendorMgr','refund']
							 ]
					});
			});
			$('#MainManager').on('click',self,function(e) {
				var self = e.data;
				posTerminal.posVerifyMgrApproval(self, function(parm1,parm2,parm3){
					posTerminal.page.manager();
				});
			});
			if (posTerminal.fullScreenMode==true) {
				$('#MainFullScreen').hide();
			}
			else {
				$('#MainFullScreen').on('click',function(e) {
					posTerminal.toggleFullScreen();
					$('#MainFullScreen').hide();
				});
			}
		},
		exitOrder:			function() {
		}
	};
