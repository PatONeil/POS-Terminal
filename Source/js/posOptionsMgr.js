/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posOptionsMgr = {
		init: 			function() {
			//  posTerminal is global varable
			this.setup();
		},
		destroy:			function() {
		},
		setup:		function() {
			var self = this,i,option,html='';
			$('#posOptionsManager .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case "Done":
						$.when(posTerminal.loadOptionsTable()).then(posTerminal.page.manager);
						break;
					default:
						alert(button+' pushed in posOptionsMgr');
						break;
				}
			});
			$.ajax({					// load options...
				dataType: "json",
				url: "scripts/optionsTable.php",
				data: {action:'list'},
				success: function( results ) {
					var i,option,html='';
					if (results.Result!="OK") {
						alert("Options Server Error,"+results.Message);
						return;
					}
					for (i in results.Records) {
						option = results.Records[i];
						html += '<div style="clear:both;padding:20px 10px;">';
						html += 	'<div style="float:left;width:200px;">'+option.option+':</div>';
						html +=		'<input type="text" data-key="'+option.key+'" style="float:left;width:300px;"';
						html +=			' value="'+option.value+'">';
						html +=		'</input>';
						html += '</div><br>';
					}
					$('#OptionsContainer').html(html);
					$('#OptionsContainer input').on('change',self,function(e) {
						var target = $(e.target),key=$(e.target).data('key');
						var data = {
							action:	'update',
							value:	$(e.target).val(),
							key:	key,
							option:	posTerminal.options[key].option
						};
						$.ajax({					// load options...
							dataType: "json",
							url: "scripts/optionsTable.php",
							data: data,
							success: function( results ) {
								var i,record;
								if (results.Result!="OK") {
									alert("Options Server Error,"+results.Message);
								}
							},
							error: function(jqXHR, textStatus, errorThrown ){
								alert("Options: "+textStatus+"  "+errorThrown);
							}
						});
						
					});
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Options: "+textStatus+"  "+errorThrown);
				}
			});
		}
	};
