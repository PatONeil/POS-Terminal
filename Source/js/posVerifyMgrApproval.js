/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.VerifyMgrApproval = {
		dialog:				null,
		context:			null, 
		callbackFunction:	null,
		password:			'',
		lastInput:			[],
		parm1:				null,
		parm2:				null,
		parm3:				null,
		init: 				function(context, callbackFunction,parm1,parm2,parm3)  {
			//  posTerminal is global varable
			this.context	= context;
			this.callbackFunction=callbackFunction;
			this.parm1		= parm1;
			this.parm2		= parm2;
			this.parm3		= parm3;
			this.password   = '';
			this.setupDialog();
		},
		destroy:			function() {
			this.dialog.dialog('destroy');
		},
		setupDialog:		function() {
			var self = this;
			$(this.setupHTML()).dialog({
				modal: true,
				draggable: true,
				resizable: false,
				width: 406,
				position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
				dialogClass: '',
				buttons: [
					{ text: "Ok",
					  click: function() {
						self.dialog = $(this);
						var approved = false;
						var num = parseFloat($('#vkTendered').val());
						var emp = parseFloat(self.dialog.find('select').val());
						if ($.isNumeric(emp)) {
							if (posTerminal.employees[emp].password == Sha1.hash(num)) approved=true;
						}	
						if (approved) {
							self.dialog.dialog('close');
							posTerminal.mgrEmployeeID=emp;
							self.callbackFunction.call(self.context,num,self.parm1,self.parm2,self.parm3);
						}
						else {
							alert("Password incorrect");
							posTerminal.mgrEmployeeID=0;
							return;
						}
					  }
					},
					{ text: "Cancel",
					  click: function() {
						$( this ).dialog( "close" );
					  }
					}
				],
				open: function( event, ui ) {
					$(this).find('button').on('click',self,self.keyboardClicked);
					$('#posKeyboard').posKeyboard({
						inputID:'vkTendered',
						keySet: 'normal',
						type: 'alpha',
						keys: {normal:['1 2 3',
									  '4 5 6',
									  '7 8 9',
									  '&#8656; 0 &#8656;']
							}
					});
				},
				close: function( event, ui ) {
					$(this).dialog('destroy').remove();
				}
			});
		},
		setupHTML:			function() {
			var i,s='',employee,options='';
			for (i in posTerminal.empSorted) {
				employee = posTerminal.empSorted[i];
				if (employee.type!='manager') continue;
				options+='<option value="'+employee.id+'">'+employee.name+'</option>';
			}
			s+='<div title="Manager Approval" style="">';
			s+=		'<div style="width:160px;float:left;">';
			s+=			'<h2 style="font-size:16px;">Select Manager:</h2>';
			s+=			'<select id="MgrSelect">';
			s+=				options;
			s+=			'</select>';
			s+=		'</div>';
			s+=		'<div style="width:180px;float:left;">';
			s+=			'<h2 style="font-size:16px;">Enter Manager Pin:</h2>';
			s+=			'	<div style="width:180px;position:static;float:left">';
			s+=			'		<input type="password"  id="vkTendered" autocomplete="new-password" ';
			s+=			'			style="border:2px solid lightblue;margin-left:0px;margin-bottom:10px;width:100px;text-align:right"';
			s+=			'           value="" />';
			s+=			'	</div>';
			s+=			'	<div id="posKeyboard" style="clear:both;float:left;display:inline-block;">';
			s+=			'	</div>';
			s+=		'</div>';
			s+='</div>';
			return s;
		},
		
	};
