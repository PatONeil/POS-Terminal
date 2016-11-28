/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posReportMgr = {
		report:				'',
		dialog:				null,
		init: 				function() {
			var html = '';
			//  posTerminal is global varable
			html += this.setupHTML();
			$('#posTerminal').children().remove();
			$('#posTerminal').html(html);
			this.setupButtons();
		},
		destroy:			function() {
		},
		setupHTML:function() {
			var html = '';
			html += '<div id="posReportManager" style="margin:0px;padding:0px;width:1024px;">';
			html +=	' 	<h1 style="margin:2px;width:100%;text-align:center;">Report Manager</h1>';
			html += '	<div style="float:left;margin:0px;padding:0px;width:1024px;">';
			html += '		<div style="padding-left:30px;width:1020px;float:left;">';
			html += '			<div style="float:left;font-size:18px;font-weight:bold">Select Report:';
			html += '				<select id="selectReport">';
			html += '					<option value="">Select Report</option>';
			html += '					<option value="dailySales^all">Daily Sales for Last 30 Days</option>';
			html += '					<option value="houseAccounts^all">Open House Account Tabs</option>';
			html += '					<option value="productSales^today">Products Sold Today</option>';
			html += '					<option value="productSales^thisWeek">Products Sold This Week</option>';
			html += '					<option value="productSales^thisMonth">Products Sold This Month</option>';
			html += '					<option value="productSales^thisYear">Products Sold this Year</option>';
			html += '					<option value="productSales^lastMonth">Products Sold LastMonth</option>';
			html += '					<option value="hourSales^today">Sales by Hour for Today</option>';
			html += '					<option value="hourSales^thisWeek">Sales by Hour for This Week</option>';
			html += '					<option value="hourSales^thisMonth">Sales by Hour for This Month</option>';
			html += '					<option value="hourSales^thisYear">Sales by Hour for this Year</option>';
			html += '					<option value="hourSales^lastMonth">Sales by Hour for LastMonth</option>';
			html += '				</select>';
			html += '			</div>';
			html += '		</div>';
			html += '	</div>';
			html += '	<div id="posReportArea" style="float:left;margin:10px;padding:0px;width:1012px;height:600px;overflow-y:auto;overflow-x:hidden;">';
			html += '	</div>';
			html += '	<div style="float:left;margin-top:10px;width:1024px;height:50px;border-top:2px solid #5c9ccc;text-align:right;padding-top:5px;">';	
			html += '		<div class="actionButton" style="margin:4px;margin-right:40px;width:100px;height:24px;">';
			html += '			<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
			html += '				Done';
			html += '			</div>';
			html += '		</div>';
			html += '	</div>';
			html += '</div>';
			return html;
		},
		getReport:			function() {
			var self = this;
			var ops = this.lastReport.split('^');
			$.ajax({					
				dataType: "json",
				url: "scripts/reportProcessor.php",
				data: {action:ops[0],modifier:ops[1]},
				success: function( results ) {
					if (results.Result!="OK") {
						alert("Report Server Error,"+results.Message);
						return;
					}
					if (results.html.length==0) {
						alert("No Records for Report");
						return;
					}
					$('#posReportArea').children().remove();
					$('#posReportArea').html(results.html);
				},
				error: function(jqXHR, textStatus, errorThrown ){
					alert("Report: "+textStatus+"  "+errorThrown);
				}
			});
		},
		setupButtons:		function() {
			var self = this;
			$('#posReportManager .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case 'Done':
						posTerminal.page.manager();
						break;
				}
			});
			$('#selectReport').on('change',self,function(e) {
				var target = $(e.target),value=target.val(),text = target.find('option:selected').text();
				if (!value || value==self.lastReport) return;
				self.lastReport = value;
				self.lastTitle  = text;
				self.getReport();
			});
		}
	};
