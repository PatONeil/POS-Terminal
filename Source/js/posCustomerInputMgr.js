/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posCustomerInputMgr = {
		dialog:				null,
		init: 				function(_order) {
			var self = this;
			//  posTerminal is global varable
			var html = this.getHTML();
			$(html).dialog({
				modal: true,
				draggable: true,
				resizable: false,
				width: 544,
				dialogClass: '',
				position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
				open: function( event, ui ) {
					self.dialog = $(this);
					self.setupButtons();
					self.setupKeyboard();
				},
				close: function( event, ui ) {
					$(this).dialog('destroy').remove();
				}
			});
		},
		getHTML:		function() {
			var s="";
			s+='<div id="newCustEntry" title="Customer Entry Dialog">';
			s+='  <h1 style="margin:0px;text-align:center;">New Customer Entry</h1><hr>';
			s+='  <div style="width:500px;clear:both;margin-top:20px;">';
			s+='    <div style="float:left;">Enter Name:</div>';
			s+='	<input id="custEntryName"  type=text style="margin-left:20px; float:left;width:150px;" />';
			s+='  </div>';
			s+= ' <div id="posKeyboard1" style="margin-top:5px;clear:both;float:left;display:inline-block;">';
			s+= ' </div>';
			s+='  <div style="width:500px;clear:both;padding-top:30px">';
			s+='    <div style="float:left;">Enter Phone Number:</div>';
			s+='	  <input id="phoneNumber" style="width:120px;margin-left:20px;"  type="text" style="float:left" />';
			s+= ' </div>';
			s+= ' <div id="posKeyboard2" style="margin-top:5px;clear:both;float:left;display:inline-block;">';
			s+= ' </div>';
			s+='  <div style="width:500px;clear:both;padding-top:30px;padding-bottom:20px">';
			s+='    <div style="float:left;">Enter Customer Type:</div>';
			s+='	<select id="custTypeSelect">';
			s+='		<option value="regular">Regular Account</option>';
			s+='		<option value="house">House Account</option>';
			s+='		<option value="corporate">Corporate Account</option>';
			s+='	</select>';
			s+= ' </div>';
			s+='	<div style="width:100%;margin:10px 0px; padding-top:10px;border-top:2px solid #5c9ccc;float:left;text-align:center;">';	
			s+='		<div class="actionButton" style="margin:4px;width:135px;height:24px;">';
			s+='			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			s+='				Save';
			s+='			</div>';
			s+='		</div>';
			s+='		<div class="actionButton" style="margin:4px;width:135px;height:24px;">';
			s+='			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			s+='				Cancel';
			s+='			</div>';
			s+='		</div>';
			s+='	</div>';	
			s+='</div>';
			return s;
		},
		titleCase:		function(text) {
			var firstLtr = 0;
			for (var i = 0;i < text.length;i++){
				if (i == 0 &&/[a-zA-Z]/.test(text.charAt(i))) firstLtr = 2;
				if (firstLtr == 0 &&/[a-zA-Z]/.test(text.charAt(i))) firstLtr = 2;
				if (firstLtr == 1 &&/[^a-zA-Z]/.test(text.charAt(i))){
					if (text.charAt(i) == "'"){
						if (i + 2 == text.length &&/[a-zA-Z]/.test(text.charAt(i + 1))) firstLtr = 3;
						else if (i + 2 < text.length &&/[^a-zA-Z]/.test(text.charAt(i + 2))) firstLtr = 3;
					}
				if (firstLtr == 3) firstLtr = 1;
				else firstLtr = 0;
				}
				if (firstLtr == 2){
					firstLtr = 1;
					text = text.substr(0, i) + text.charAt(i).toUpperCase() + text.substr(i + 1);
				}
				else {
					text = text.substr(0, i) + text.charAt(i).toLowerCase() + text.substr(i + 1);
				}
			}
			return text;
		},	
		setupButtons:	function() {
			var self = this;
			$('#newCustEntry .actionButton').on('click',self,function(e) {
				var i,v=-1,button = $(e.target).text().trim();
				switch (button) {
					case 'Save':
						var name = $('#custEntryName').val();
						if (!name) {
							alert("Name must be provided!");
							return;
						}
						name = self.titleCase(name);
						for (i in posTerminal.customers) {
							if (posTerminal.customers[i].name==name) {
								alert("Name already exist!");
								return;
							}
						}
						var phone=$('#phoneNumber').val().replace(/[\-\(\) ]/,'');
						if (phone.length!=10) {
							alert("Phone number must be provided!");
							return;
						}						
						var type = $('#custTypeSelect').val();
						if (!type) {
							alert("Type of customer must be selected");
							return;
						}
						self.updateDatabase(name,phone,type);
						break;
					case 'Cancel':
						self.dialog.dialog('close');
						break;
					case 'Add Customer':
						alert("Add customer not yet supported. Use customer edit function in Manager's page.");
						break;
				}	
			});
		},
		updateDatabase:	function(name,phone,type) {
			var self = this;
			var data={action:'create',name:name,phone:phone,type:type,
					  creditCard:"",taxExempt:0};
			$.ajax({					// load options...
				dataType: "json",
				url: "scripts/customerTable.php",
				data: data,
				success: function( results ) {
					var i,record;
					if (results.Result!="OK") {
						alert("CustomerTable Server Error,"+results.Message);
						return;
					}
					record = results.Record;
					posTerminal.customers[record.id]=record;
					self.dialog.dialog('close');
					posTerminal.posCustomerSelectMgr.fillInFields();
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Options: "+textStatus+"  "+errorThrown);
				}
			});
		},
		setupKeyboard:	function() {
			var self = this;	
			$('#posKeyboard1').posKeyboard({
				alwaysShow:true,
				keySet: 'normal',
				inputID:'custEntryName'
			});
			$('#posKeyboard2').posKeyboard({
				alwaysShow:true, 
				keySet: 'normal',
				inputID:'phoneNumber',
				keys: {'normal':['1 2 3 4 5 6 7 8 9 0 &#8656;']}
			});
		}	
		  
	}
