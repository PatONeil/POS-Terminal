/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posAddDropVendorEdit = {
		init: 			function() {
			//  posTerminal is global varable
			this.setup();
		},
		destroy:			function() {
		},
		setup:		function() {
			var self = this;
			$('#posAddDeleteVendorManager .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case "Done":
						$.when(posTerminal.loadTillUsesTable()).then(posTerminal.page.manager);
						break;
					default:
						alert(button+' pushed in posCustomerMgr');
						break;
				}
			});
		$('#AddDropVendorContainer').jtable({
				title: 'Customer List',
				sorting: true, //Enable sorting
				defaultSorting: 'type ASC',
				actions: {
					listAction: 	'scripts/tillUsesTable.php?action=list',
					createAction: 	'scripts/tillUsesTable.php?action=create',
					updateAction: 	'scripts/tillUsesTable.php?action=update',
					deleteAction: 	'scripts/tillUsesTable.php?action=delete'
				},
				fields: {
					id: {
						key: true,
						edit:false,
						create:false,
						list: false
					},
					type: {
						title: 'Type',
						inputClass: 'validate[required]',
						options: {
							'add':"Add Funds",'drop':"Drop Funds",'vendor':'Vendors' 
							}
					},
					name: {
						title: 'Name',
						inputClass: 'validate[required]'
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
			$('#AddDropVendorContainer').jtable('load');
		}
	};
