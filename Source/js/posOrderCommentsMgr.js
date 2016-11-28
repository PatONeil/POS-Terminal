/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posOrderCommentsMgr = {
		dialog:				null,
		init: 				function() {
			var html = '';
			//  posTerminal is global varable
			html += this.setupSelection();
			//this.setupActionKeys();
			this.setupDialog(html);
		},
		destroy:			function() {
			this.dialog.dialog('destroy').remove();
		},
		setupSelection:function() {
			var i,html = '';
			html += '<div id="posCommentsMgr" title="Order Comments" style="overflow:hidden;width:500px;">';
			html +=	' 	<div style="float:left;margin:0px;padding:0px;height:300px;overflow:hidden;">';
			html += '		<div style="padding-left:20px;width:470px;float:left;">';
			html += '			<h3 style="margin-bottom:5px;">Enter Comments:</h3>';
			html += '			<div style="width:330px;position:static;float:left">';
			html += '				<textarea id="commentsInput"  rows="3" style="border:2px solid lightblue;width:300px;height:50px;">'+posTerminal.posMenuOrderMgr.order.comments+'</textarea>';
			html += '			</div>';
			html += '			<div id="posKeyboard" style="clear:both;float:left;display:inline-block;">';
			html += '			</div>';
			html += '		</div>';
			html += '	</div>';
			html += '	<div style="float:left;margin-top:10px;width:100%;height:50px;border-top:2px solid #5c9ccc;text-align:center;padding-top:5px;">';	
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
			$(html)
			  .dialog({
				modal: true,
				draggable: false,
				resizable: false,
				width: 608,
				height:450,
				dialogClass: '',
				position:{ my: "center", at: "center", of: $('#posTerminal')[0] },
				open: function( event, ui ) {
					var tenderDialog=$(this);
					var h = ($('body').height()/768);
					var w = ($('body').width()/1024);
					tenderDialog.parents('.ui-dialog').css({'transform':'scaleX('+w+') '+ 'scaleY(' + h +')','transform-origin':'0px 0px'});
					self.dialog = tenderDialog;
					$('#posKeyboard').posKeyboard({
						inputID: 'commentsInput',
						keySet: 'normal'
					});
				},
				close: function( event, ui ) {
					$(this).dialog('destroy').remove();
				}
			});
			this.setupButtons();
		},
		setupButtons:		function() {
			var self = this;
			$('#posCommentsMgr .actionButton').on('click',self,function(e) {
				var button = $(e.target).text().trim();
				switch (button) {
					case 'OK':
						var desc = $('#commentsInput').val();
						posTerminal.posMenuOrderMgr.order.comments = desc;
						posTerminal.posMenuTicketMgr.refreshTicketDisplay();
						self.dialog.dialog('close');
						break;
					case 'Cancel':
						self.dialog.dialog('close');
						break;
				}
			});
		}
	};
