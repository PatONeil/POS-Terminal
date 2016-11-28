/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posProductMgr = {
		init: 			function() {
			//  posTerminal is global varable
			this.setup();
		},
		destroy:			function() {
		},
		setup:		function() {
			var self = this;
			$('#posProductManager .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case "Done":
						$.when(posTerminal.loadProductTable()).then(posTerminal.page.manager);
						break;
					default:
						alert(button+' pushed in posProductMgr');
						break;
				}
			});
		$('#InventoryContainer').jtable({
				title: 'Product List',
				sorting: true, //Enable sorting
				defaultSorting: 'category ASC',
				actions: {
					listAction: 	'scripts/productsTable.php?action=list',
					createAction: 	'scripts/productsTable.php?action=create',
					updateAction: 	'scripts/productsTable.php?action=update',
					deleteAction: 	'scripts/productsTable.php?action=delete'
				},
				fields: {
					id: {
						key: true,
						edit:false,
						create:false,
						list: false
					},
					category: {
						title: 'Category',
						inputClass: 'validate[required]',
						options: {
							'breakfast':"Breakfast", 
							'lunch':"Lunch", 
							'salads':"Salads",
							'sides':"Sides",
							'drinks':"Drinks", 
							'snacks':"Snacks", 
							'condiments':"Condiments" 
							}
					},
					longText: {
						inputClass: 'validate[required]',
						title: 'Long Text'
					},
					shortText: {
						inputClass: 'validate[required,maxSize[20]]',
						title: 'Short Text'
					},
					type: {
						title: 'Type',
						inputClass: 'validate[required]',
						options: {
							'menuItem':"Menu Item",'attribute':"Menu Attribute" 
							}
					},
					price: {
						title: 'Price',
						inputClass: 'validate[required,custom[number]]',
						defaultValue:0
					},
					taxable: {
						title: "Taxable",
						defaultValue: 1,
						options: {0:"No",1:"Yes"}
					},
					prepLocation: {
						title: "Prep Loc",
						defaultValue: 0,
						options: {0:"Counter",1:"Kitchen"}
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
			$('#InventoryContainer').jtable('load');
		}
	};
