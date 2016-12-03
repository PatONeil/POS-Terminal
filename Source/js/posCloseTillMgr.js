/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posCloseTillMgr = {
		type:				'cash',
		dialog:				null,
		caption:			'Open Till',
		init: 				function() {
			var html = '';
			//  posTerminal is global varable
			html += this.setupTenderSelection();
			this.setupDialog1(html);
		},
		destroy:			function() {
			this.dialog.dialog('destroy').remove();
		},
		setupTenderSelection:function() {
			var html = '';
			html += '<div id="openTillManager" title="Select Till" style="margin:0px;padding:0px;width:600px;overflow:hidden;">';
			html +=	' 	<h1 style="margin:2px;width:100%;text-align:center;">Select Till</h1>';
			html += '	<div style="float:left;margin:0px;padding:0px;width:300px;overflow:hidden;">';
			html += '		<div style="padding-left:30px;width:235px;float:left;">';
			html += '			<select id="tillOpenSelect">';
			for (i in posTerminal.options) {
				if (i.match(/^till\d(?!.)/i)) {
					html += '		<option value="'+i+'">'+posTerminal.options[i].value+'</option>';
				}
			}
			html += '			</select>';
			html += '		</div>';
			html += '	</div>';
			html += '	<div style="float:left;margin-top:10px;width:300px;height:50px;border-top:2px solid #5c9ccc;text-align:center;padding-top:5px;">';	
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
		setupDialog1:		function(html) {
			var self = this;
			$(html).dialog({
				modal: true,
				draggable: true,
				resizable: false,
				position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
				width: 308,
				dialogClass: '',
				open: function( event, ui ) {
					self.dialog = $(this);
				},
				close: function( event, ui ) {
					$(this).dialog('destroy').remove();
				}
			});
			this.setupButtons1();
		},
		setupButtons1:		function() {
			var self = this;
			$('#openTillManager .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case 'OK':
						self.activeTill = $('#tillOpenSelect').val();
						self.settlementPreview(self.activeTill);
						self.dialog.dialog('close');
						break;
					case 'Cancel':
						self.dialog.dialog('close');
						break;
				}
			});
		},
		settlementPreview:	function(till){
			var self = this;
			$.ajax({					// 
				dataType: "json",
				url: "scripts/tillManager.php",
				data: {action:'settlementPreview',till:till},
				success: function( results ) {
					var i,record;
					if (results.Result!="OK") {
						alert(results.Message);
						return;
					}
					if (results.Records.length==0) {
						alert('No till records to display. Were there any activity today?');
						return;
					}
					if (results.Records.length==1 && results.Records[0].entryType=='tillClose') {
						alert('Till already closed!');
						return;
					}
					
					self.settlementDialog(results.Records);
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("posCloseTillMgr: "+textStatus+"  "+errorThrown);
				}
			});			
		},
		settlementDialog:	function(records) {
			var self = this,html='';
			html+=this.setupPreviewHTML(records);
			$(html).dialog({
				modal: true,
				draggable: true,
				resizable: false,
				position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
				width: 904,
				dialogClass: '',
				open: function( event, ui ) {
					self.dialog=$(this);
				},
				close: function( event, ui ) {
					$(this).dialog('destroy').remove();
				}
			});
			this.setupButtons2();
			$('#accordion .subTotal').on('click', function() {
				$(this).prev('div').toggle();
			});

		},
		setupButtons2:		function(){
			var self = this;
			$('#TillClosePreviewManager .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case 'Print':
						self.TillPrint();
						break;
					case 'Close Till':
						self.TillClose();
						break;
					case 'Cancel':
						self.dialog.dialog('close');
						break;
				}
			});
		},
		TillPrint:			function() {
			$.ajax({					// 
				dataType: "json",
				url: "scripts/posTillReportPrint.php",
				data: {till:this.activeTill},
				success: function( results ) {
					var i,record;
					if (results.Result!="OK") {
						alert(results.Message);
						return;
					}
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("posCloseTillPrintMgr: "+textStatus+"  "+errorThrown);
				}
			});			
		},
		TillClose:			function() {
			var self = this,till=this.activeTill;
			$.ajax({					// 
				dataType: "json",
				url: "scripts/tillManager.php",
				data: {action:'closeTill',till:this.activeTill,amount:-parseFloat(self.tillAmount),employeeID:posTerminal.mgrEmployeeID},
				success: function( results ) {
					var i,record;
					if (results.Result=="OK") {
						self.dialog.dialog('close');
						posTerminal.logMessage("Till " + till + " closed by posCloseTillMgr");					
						posTerminal.tillOpen=false;
					}	
					else alert(results.Message);
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Till Close: "+textStatus+"  "+errorThrown);
				}
			});			
			
		},
		setupPreviewHTML:	function(records) {
			var i,record,rTotal=0,entry=records[0].entryType,html = '',s='';
			for (i in records) records[i]['total']=rTotal+=parseFloat(records[i].amount);
			html += '<div id="TillClosePreviewManager" title="Settlement Preview" style="margin:0px;padding:0px;width:900px;overflow:hidden;">';
			html +=	'	<h1 style="margin:8px;width:100%;text-align:center;">Settlement Preview</h1>';
			html +=	'	<div style="font-size:14px;width:875px;margin-left:25px;margin-bottom:10px;float:left;border-bottom:1px solid black;font-weight:bold">';
			html +=	'		<div style="float:left;width:80px;">Entry</div>';
			html +=	'		<div style="float:left;width:140px;">Date</div>';
			html +=	'		<div style="float:left;width:220px;">Reference</div>';
			html +=	'		<div style="float:left;width:255px;">Description</div>';
			html +=	'		<div style="float:left;width:75px;text-align:right;">Amount</div>';
			html +=	'		<div style="float:left;width:75px;text-align:right;">Total</div>';
			html +=	'	</div>';
			html +=	'	<div id="accordion" style="font-size:12px;width:900px;display:block;overflow-y:auto;height:470px;">';
			rTotal = 0;
			for (i in records) {
				record=records[i];
				s +=	'	<div style="clear:both;font-size:12px;width:875px;display:block;">';
				s +=	'		<div style="float:left;width:80px;">'+record.entryType+'</div>';
				s +=	'		<div style="float:left;width:140px;">'+record.date+'</div>';
				s +=	'		<div style="float:left;width:220px;">'+(record.reference||'&nbsp;')+'</div>';
				s +=	'		<div style="float:left;width:255px;">'+(record.description||'&nbsp;')+'</div>';
				s +=	'		<div style="float:left;width:75px;text-align:right;">'+parseFloat(record.amount).toFixed(2)+'</div>';
				s +=	'		<div style="float:left;width:75px;text-align:right;">'+parseFloat(record.total).toFixed(2)+'</div>';
				s +=	'	</div>';
				rTotal += parseFloat(record.amount);
				entry = record.entryType;
				if (i==records.length-1 || records[1+parseInt(i)].entryType!=entry) {		// print subtotal
					html += '<div style="clear:both;margin-left:25px;display:none;width:875px;">' + s + '<hr style="clear:both;margin-bottom:-3px;"></div>';
					html +=	'<div class="subTotal" style="clear:both; margin-left:8px;margin-bottom:8px;float:left;font-size:14px;font-weight:bold;width:875px;display:block;">';
					html += '	<div style="float:left;margin-top:2px;" class="ui-accordion-header-icon ui-icon ui-icon-triangle-1-e"></div>';
					html +=	'	<div style="float:left;width:130px;">'+entry+' Total</div>';
					html +=	'	<div style="float:left;width:110px;">&nbsp;</div>';
					html +=	'	<div style="float:left;width:220px;">&nbsp;</div>';
					html +=	'	<div style="float:left;width:238px;">&nbsp;</div>';
					html +=	'	<div style="float:left;width:75px;text-align:right;">'+parseFloat(rTotal).toFixed(2)+'</div>';
					html +=	'	<div style="float:left;width:75px;text-align:right;">&nbsp;</div>';
					html +=	'</div>';
					s = '';
					rTotal = 0;
				}
			}
			html += '   </div> <!-- end accordion -->';
			html +=	'<div style="clear:both; width:875px;margin-left:25px;float:left;font-size:14px;font-weight:bold;">';
			html +=	'	<div style="float:left;width:130px;">Total</div>';
			html +=	'	<div style="float:left;width:110px;">&nbsp;</div>';
			html +=	'	<div style="float:left;width:220px;">&nbsp;</div>';
			html +=	'	<div style="float:left;width:238px;">&nbsp;</div>';
			html +=	'	<div style="float:left;width:75px;text-align:right;">'+parseFloat(record.total).toFixed(2)+'</div>';
			html +=	'	<div style="float:left;width:75px;text-align:right;">&nbsp;</div>';
			html +=	'</div>';
			this.tillAmount = record.total;
			html += '	<div style="float:left;margin-top:10px;width:900px;height:50px;border-top:2px solid #5c9ccc;text-align:center;padding-top:5px;">';	
			html += '		<div class="actionButton" style="margin:4px;width:100px;height:24px;">';
			html += '			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			html += '				Print';
			html += '			</div>';
			html += '		</div>';
			html += '		<div class="actionButton" style="margin:4px;width:100px;height:24px;">';
			html += '			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			html += '				Close Till';
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
		}
	
	};
