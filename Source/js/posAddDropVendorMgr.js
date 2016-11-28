/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posAddDropVendorMgr = {
		type:				'',
		dialog:				null,
		title:				{add:"Add To Till",drop:"Take From Till",
							 vendor:"Pay Vendor From Till",refund:"Refund from Vendor To Till"},
		desc:				{add:"Select Add Reason:",drop:"Select Take From Till Reason:",
							 vendor:"Select Vendor",refund:"Select Vendor"},
		$input:				null,
		reason:				'',
		lastInput:			[],
		init: 				function(type) {
			var html = '';
			this.type = type;
			//  posTerminal is global varable
			html += this.setupSelection();
			//this.setupActionKeys();
			this.setupDialog(html);
		},
		destroy:			function() {
			this.dialog.dialog('destroy').remove();
		},
		setupSelection:function() {
			var i,type,html = '',desc=this.desc[this.type],title=this.title[this.type];
			var reason,reasons = posTerminal.tillUses,options=posTerminal.options,emp=posTerminal.empSorted;
			var keys=[
					['^$20',"^25&cent;","\t",1,2,3],
					['^$10',"^10&cent;","\t",4,5,6],
					["^$5","^5&cent;","\t",7,8,9],
					["^$1","^1&cent;","\t","00",0,"&#9003;"]];
			html += '<div id="AddDropVendorMgr" title="'+title+'" style="margin:0px;padding:0px;width:780px;overflow:hidden;">';
			html +=	' 	<h1 style="margin:2px;width:100%;text-align:center;">'+this.type.charAt(0).toUpperCase() + this.type.slice(1)+' Manager</h1>';
			html += '	<div style="float:left;margin:0px;padding:0px;width:780px;overflow:hidden;">';
			html += '	<div style="float:left;margin:0px;padding:0px;width:320px;overflow:hidden;float:">'; //left
			html += '		<div style="padding-left:15px;width:320px;float:left;">';
			html += '		  <div style="width:200px;float:left;">';
			html += '			<h3 style="margin-bottom:5px;">Employee:</h3>';
			html += '			<select id="tillEmployeeSelect">';
			html += '				<option value="-1">Select Employee</option>';
			for (i in emp) {
				html += '			<option value="'+emp[i].id+'">'+emp[i].name+'</option>';
			}
			html += '			</select>';
			html += '		  </div>';
			html += '		  <div style="width:150px;float:left;">';
			html += '			<h3 style="margin-bottom:5px;">Till:</h3>';
			html += '			<select id="tillOpenSelect">';
			for (i in options) {
				if (i.match(/^till\d(?!.)/i)) {
					html += '		<option value="'+i+'">'+options[i].value+'</option>';
				}
			}
			html += '			</select>';
			html += '		  </div>';
			html += '		</div>';
			html += '		<div style="padding-left:15px;width:320px;float:left;">';
			html += '			<h3 style="margin-top:15px;margin-bottom:5px;">'+desc+'</h3>';
			html += '			<ul id="addDropVendorUL" style="font-size:15px;list-style:none;height:275px;padding:0px;padding-left:20px;overflow-y:auto;">';
			type = this.type;
			if (type=='refund') type='vendor'; 
			for (i=0;i< reasons.length;i++) {
				reason = reasons[i];
				if (reason.type!=type) continue;
				html +='			<li class="addDropListButton" data-value="'+i+'">'+reason.name+'</li>';
			}
			html += '			</ul>';
			html += '		</div>';
			html += '		</div>';  // end left;
			html += '		<div style="width:454px;float:left;">';	// right
			html += '			<div style="width:454px;float:left;">';
			html += '				<h3 style="margin-bottom:5px;width:454px;">Description:';
			html += '					<div style="display:inline-block;">';
			html += '						<input id="advDesc"   style="border:2px solid lightblue;margin-left:10px;width:290px;" type="text" value="" />';
			html += '					</div>';
			html += '				</h3>';
			html += '				<div id="posKeyboard1" style="margin-top:5px;clear:both;float:left;display:inline-block;">';
			html += '				</div>';
			html += '			<div style="width:320px;float:left;">';
			html += '				<h3 style="margin-bottom:5px;"> Enter Amount:';
			html += '					<div style="display:inline-block;">';
			html += '						<input type="text"  id="vkTendered" ';
			html += '						style="border:2px solid lightblue;margin-left:10px;width:100px;text-align:right"';
			html += '				           value="" />';
			html += '					</div>';
			html += '				</h3>';
			html += '				<div id="posKeyboard2" style="clear:both;float:left;display:inline-block;">';
			html += '				</div>';
			html += '			</div>';
			html += '		</div>';  // end right
			html += '	</div>';  // end left/right
			html += '	<div style="float:left;margin-top:10px;width:700px;height:50px;border-top:2px solid #5c9ccc;text-align:center;padding-top:5px;">';	
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
		setupDescription:	function() {
			var self = this;
			$('#posKeyboard1').posKeyboard({
				alwaysShow:true,
				keySet: 'normal',
				inputID:'advDesc'
			});
			$('#posKeyboard2').posKeyboard({
				inputID:'vkTendered',
				keySet: 'normal',
				type: 'numeric',
				keys: {normal:['$20{50} 25&cent;{50} \t 1 2 3',
							  '$10{50} 10&cent;{50} \t 4 5 6',
							  '$5{50} 5&cent;{50} \t 9 8 7',
							  '$1{50} 1&cent;{50} \t 00 0 &#8656;']
					}
			});
			return;
		},
		setupDialog:		function(html) {
			var self = this;
			$(html).dialog({
				modal: true,
				draggable: true,
				resizable: false,
				width: 800,
				dialogClass: '',
				position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
				open: function( event, ui ) {
					var tenderDialog=$(this);
					self.dialog = tenderDialog;
					self.setupDescription();
				},
				close: function( event, ui ) {
					$(this).dialog('destroy').remove();
				}
			});
			this.setupButtons();
			this.$input = $('#vkTendered');
		},
		setupButtons:		function() {
			var self = this;
			$('#addDropVendorUL li').on('click',self,function(e) {
				$('#addDropVendorUL li').removeClass('addDropListButtonActive');
				self.reason =$(e.target).data('value');
				$(e.target).addClass('addDropListButtonActive');
			});
			$('#AddDropVendorMgr .actionButton').on('click',self,function(e) {
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
			var emp  = parseInt($('#tillEmployeeSelect').val());
			var amt  = ($('#vkTendered').val()+" ").replace(/[^\d.-]/g,'')||0;
			if (!till || till=='undefined') {
				alert("Till must be specified");
				
				return;
			}
			if (!emp || emp=='undefined' || emp==-1) {
				alert("Employee must be specified");
				return;
			}
			if (this.reason==='') {
				alert("Reason must be specified");
				return;
			}
			if (!amt) {
				alert("Amount must be specified");
				return;
			}
			amt = parseFloat(amt.replace('$',''));
			if (this.type=='drop' || this.type=='vendor') amt = -amt;
			if (this.type=='refund') this.type='vendor';
			amt = amt.toFixed(2);
			$.ajax({					// 
				dataType: "json",
				url: "scripts/tillManager.php",
				data: {action:'tillOps',type:this.type+'Till',till:till,entryType:this.type, 
					   employeeID:emp, description:$('#advDesc').val(),
					   reference:posTerminal.tillUses[this.reason].name,amount:amt
				},
				success: function( results ) {
					var i,record;
					if (results.Result=="OK") {
						self.dialog.dialog('close');
						posTerminal.openCashDrawer();
					}
					else {
						alert(results.Message);
						self.dialog.dialog('close');
					}
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Options: "+textStatus+"  "+errorThrown);
				}
			});			
		}
	};
