/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posOpenTillMgr = {
		type:				'cash',
		dialog:				null,
		$input:				null,
		caption:			'Open Till',
		lastInput:			[],
		init: 				function() {
			var html = '';
			//  posTerminal is global varable
			html += this.setupTenderSelection();
			//this.setupActionKeys();
			this.setupDialog(html);
		},
		destroy:			function() {
			this.dialog.dialog('destroy').remove();
		},
		setupTenderSelection:function() {
			var i,options=posTerminal.options,html = '';
			html += '<div id="openTillManager" title="Open Till" style="margin:0px;padding:0px;width:600px;overflow:hidden;">';
			html +=	' 	<h1 style="margin:2px;width:100%;text-align:center;">Open Till Manager</h1>';
			html += '	<div style="float:left;margin:0px;padding:0px;width:600px;overflow:hidden;">';
			html += '		<div style="padding-left:30px;width:235px;float:left;">';
			html += '			<h3> Select Till:</h3>';
			html += '			<select id="tillOpenSelect">';
			for (i in options) {
				if (i.match(/^till\d(?!.)/i)) {
					html += '		<option value="'+i+'">'+options[i].value+'</option>';
				}
			}
			html += '			</select>';
			html += '		</div>';
			html += '		<div style="width:320px;float:left;">';
			html += '			<h3> Enter Opening Amount:</h3>';
			html += '			<div style="width:330px;position:static;float:left">';
			html += '				<input type="text"  id="vkTendered" ';
			html += '					style="border:2px solid lightblue;margin-left:165px;margin-bottom:10px;width:100px;text-align:right"';
			html += '		           value="" />';
			html += '			</div>';
			html += '			<div id="posKeyboard" style="clear:both;float:left;display:inline-block;">';
			html += '			</div>';
			html += '		</div>';
			html += '	</div>';
			html += '	<div style="float:left;margin-top:10px;width:600px;height:50px;border-top:2px solid #5c9ccc;text-align:center;padding-top:5px;">';	
			html += '		<div class="actionButton" style="margin:4px;width:100px;height:24px;">';
			html += '			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			html += '				OK';
			html += '			</div>';
			html += '		</div>';
			html += '		<div class="actionButton" style="margin:4px;width:100px;height:24px;">';
			html += '			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			html += '				Cancel';
			html += '			</div>';
			html += '		</div>';
			html += '	</div>';
			html += '</div>';
			return html;
		},
		setupDialog:		function(html) {
			var self = this;
			$(html).dialog({
				modal: true,
				draggable: true,
				resizable: false,
				width: 608,
				dialogClass: '',
				position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
				open: function( event, ui ) {
					var tenderDialog=$(this);
					self.dialog = tenderDialog;
					self.setupButtons();
					$('#posKeyboard').posKeyboard({
						inputID:'vkTendered',
						keySet: 'normal',
						type: 'numeric',
						keys: {normal:['$20{50} 25&cent;{50} \t 1 2 3',
									  '$10{50} 10&cent;{50} \t 4 5 6',
									  '$5{50} 5&cent;{50} \t 9 8 7',
									  '$1{50} 1&cent;{50} \t 00 0 &#8656;']
							}
					});
				},
				close: function( event, ui ) {
					$(this).dialog('destroy').remove();
				}
			});
		},
		setupButtons:		function() {
			var self = this;
			$('#openTillManager .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case 'OK':
						self.updateTillStatus();
						break;
					case 'Cancel':
						self.dialog.dialog('close');
						break;
				}
			});
		},
		updateTillStatus:	function() {
			var self = this;
			var till = $('#tillOpenSelect').val();
			var amt  = $('#vkTendered').val().replace('$','');
			if (!till) {
				alert("Till must be specified");
				return;
			}
			if (!amt) {
				alert("Amount must be specified");
				return;
			}
			$.ajax({					// 
				dataType: "json",
				url: "scripts/tillManager.php",
				data: {action:'openTill',till:till,amount:amt,employeeID:posTerminal.mgrEmployeeID},
				success: function( results ) {
					var i,record;
					if (results.Result=="OK") {
						self.dialog.dialog('close');
						posTerminal.logMessage("Till " + till + " opened  by posOpenTillMgr with "  + amt);					
						posTerminal.tillOpen=true;
					}
					else alert(results.Message);
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Options: "+textStatus+"  "+errorThrown);
				}
			});			
		}
	};
