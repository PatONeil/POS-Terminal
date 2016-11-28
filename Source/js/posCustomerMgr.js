/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posCustomerMgr = {
		init: 			function() {
			//  posTerminal is global varable
			this.setup();
		},
		destroy:			function() {
		},
		setup:		function() {
			var self = this;
			$('#posCustomerManager .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case "Done":
						$.when(posTerminal.loadCustomerTable()).then(posTerminal.page.manager);
						break;
					default:
						alert(button+' pushed in posCustomerMgr');
						break;
				}
			});
		$('#CustomerContainer').jtable({
				title: 'Customer List',
				sorting: true, //Enable sorting
				defaultSorting: 'category ASC',
				actions: {
					listAction: 	'scripts/customerTable.php?action=list',
					createAction: 	'scripts/customerTable.php?action=create',
					updateAction: 	'scripts/customerTable.php?action=update',
					deleteAction: 	'scripts/customerTable.php?action=delete'
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
							'corporate':"Corporate Account",'house':"House Account",'regular':"Regular Customer" 
							}
					},
					creditCard: {
						title: 'Credit Card'
					},
					taxExempt: {
						title: 'Tax Exempt',
						inputClass: 'validate[required]',
						defaultValue: '0',
						options: {
							'0':"Non Exempt",'1':"Exempt" 
							}
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
			$('#CustomerContainer').jtable('load');
		}
	};
