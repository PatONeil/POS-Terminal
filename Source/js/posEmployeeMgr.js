/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posEmployeeMgr = {
		init: 			function() {
			//  posTerminal is global varable
			this.setup();
		},
		destroy:			function() {
		},
		setup:		function() {
			var self = this;
			$('#posEmployeeManager .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case "Done":
						$.when(posTerminal.loadEmployeeTable()).then(posTerminal.page.manager);
						break;
					default:
						alert(button+' pushed in posEmployeeMgr');
						break;
				}
			});
		$('#EmployeeContainer').jtable({
				title: 'Employee List',
				sorting: true, //Enable sorting
				defaultSorting: 'category ASC',
				actions: {
					listAction: 	'scripts/employeeTable.php?action=list',
					createAction: 	'scripts/employeeTable.php?action=create',
					updateAction: 	'scripts/employeeTable.php?action=update',
					deleteAction: 	'scripts/employeeTable.php?action=delete'
				},
				messages: {
					deleteConfirmation: 'Deleting record may cause problem in viewing old orders/reports. Please use inactive if at all possible. Are you sure?',
 				},
				fields: {
					id: {
						key: true,
						edit:false,
						create:false,
						list: false
					},
					name: {
						title: 'Name',
						inputClass: 'validate[required]'
					},
					phone: {
						title: 'Phone'
					},
					type: {
						title: 'Type',
						inputClass: 'validate[required]',
						options: {
							'manager':"manager",'non manager':"non manager" 
							}
					},
					password: {
						title: 'Password'
					},
					active: {
						title:  'Active',
						defaultValue:1,
						options: {1:'active',0:'inactive'}
					}
				},
				//Initialize validation logic when a form is created
				formCreated: function (event, data) {
					data.form.validationEngine({promptPosition : "bottomLeft"});
				},
				//Validate form when it is being submitted
				formSubmitting: function (event, data) {
					return data.form.validationEngine('validate');
				},
				//Dispose validation logic when form is closed
				formClosed: function (event, data) {
					data.form.validationEngine('hide');
					data.form.validationEngine('detach');
				}
				
			});
			$('#EmployeeContainer').jtable('load');
		}
	};
