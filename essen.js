/* JavaScript for essen.html */

   var InventoryList = [
      {value:"Dummy", label:"Dummy", price: 0.00, id: 0}
   ];
   var MonthNames = [ "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember" ];
   var selectedYear = null;
   var selectedMonth = null;
   var scrollPosInvList = -1;
   
   $(document).ready(function() {
      loadInventoryList();
      $("#save").click(saveProtocolEntry);
      setupAutoComplete();
      setupDatePicker();
      $("#error-messages-close").click(function() { $("#error-messages").hide(); });
      loadProtocolSumList();
      initProtFilter();
      loadProtocolList();
      initToggleButtons();
      setupConfirmDialog();
      setupSubmitByEnter();
      $("#inventory").focus();
      setupInfoDialog();
      initInventoryFilter();
   });
   
   function initProtFilter() {
      var currentDate = new Date();
      selectedYear = currentDate.getFullYear();
      selectedMonth = currentDate.getMonth() + 1;
      showProtFilter();
   }
   
   // protocol-entry could also be saved by just hitting the ENTER-key
   function setupSubmitByEnter() {
      $("#inventory,#price").keypress(function(event) {
          if (event.which == 13) {
              event.preventDefault();
              saveProtocolEntry();
          }
      });
   }
   
   function setupAutoComplete() {
      $("#inventory").autocomplete({
         source: InventoryList, 
         select: inventorySelected,
         search: inventorySearch
      });
   }
   
   function setupDatePicker() {
      setCurrentDateAsInput();
      $("#datetime").datepicker({
         dateFormat: "dd.mm.yy",
         dayNames: [ "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag" ],
         dayNamesMin: [ "So", "Mo", "Di", "Mi", "Do", "Fr", "Sa" ],
         dayNamesShort: [ "So", "Mo", "Di", "Mi", "Do", "Fr", "Sa" ],
         monthNames: MonthNames,
         monthNamesShort: [ "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez" ],
         firstDay: 1,
         changeMonth: true,
         changeYear: true,
         yearRange: "c-10:c+0",
         showOtherMonths: true,
         selectOtherMonths: true
      });
   }
   
   function setupConfirmDialog() {
      $("#dialog-confirm").dialog({
         resizable: false,
         width: 400,
         modal: true,
         autoOpen: false,
         buttons: {
            "Abbrechen": function() {
               $(this).dialog( "close" );
            },
            "Löschen": function() {
               $(this).dialog( "close" );
               var param = $(this).data("param");
               var func = $(this).data("func");
               if(func != null) {
                  func(param);
               }
               $(this).data("param","");
               $(this).data("func",null);
            }
         }
      });
   }
   
   // get current date and set it as input-value
   function setCurrentDateAsInput() {
      var date = new Date();
      var month = date.getMonth() + 1;
      var day = date.getDate();
      var currentDate = (day < 10 ? '0' : '') + day + '.' +
                   (month < 10 ? '0' : '') + month + '.' +
                   date.getFullYear();
      $("#datetime").val(currentDate);
   }
   
   // init all toggle-buttons
   function initToggleButtons() {
      $(".togglebtn").each(function() {
         doToggleBtnAction(this,true);
         $(this).click(function() {
            doToggleBtnAction(this,false);
         });
      });
   }
   
   // execute the toggle-action: show/hide the element and toggle the icon
   function doToggleBtnAction(theElement, useCurrent) {
      // char-codes found here http://stackoverflow.com/a/2701226
      var closeBtn = "&#x25B2;";
      var openBtn = "&#x25BC;";
      var isOpen = $(theElement).data("open");
      var shouldOpen = (useCurrent != null && useCurrent) ? isOpen : !isOpen;
      var id = $(theElement).data("id");
      if(shouldOpen) {
         $("#"+id).show(400);
         $(theElement).html(closeBtn);
         $(theElement).attr("title","Ausblenden");
      } else {
         $("#"+id).hide(400);
         $(theElement).html(openBtn);
         $(theElement).attr("title","Einblenden");
      }
      $(theElement).data("open",shouldOpen);
   }
   
   // AutoComplete-callback if an entry from the list was selected
   function inventorySelected(event, ui) {
      //$("#price").prop('disabled', true);
      $("#price").val(ui.item.price);
      $("#invid").val(ui.item.id);
   }
   
   // AutoComplete-callback if a new search starts
   function inventorySearch(event, ui) {
      $("#price").prop('disabled', false);
      $("#invid").val("-1");
   }
   
   function loadProtocolSumList() {
      execAjax({ action: "listProtocolSums" }, processReceivedProtocolSumList);
   }
   
   function loadProtocolList() {
      var yearVal = (selectedYear != null ? selectedYear : "");
      var monthVal = (selectedMonth != null ? selectedMonth : "");
      execAjax({ action: "listProtocol", year: yearVal, month: monthVal }, processReceivedProtocolList);
   }
   
   function loadInventoryList() {
      var filterString = $("#inventory_filter").val();
      var data = { action: "listInventory", filter: filterString };
      var orderby = $("#inventory_list").data("orderby");
      var orderdir = $("#inventory_list").data("orderdir");
      if(orderby != null && orderby != "") {
         if(orderdir != null && orderdir != "") {
            orderby = orderby + " " + orderdir;
         }
         data["orderby"] = orderby;
      }
      execAjax(data, processReceivedInventoryList);
   }
   
   function showConfirmDialog(param, func) {
      $("#dialog-confirm").data("param",param);
      $("#dialog-confirm").data("func",func);
      $("#dialog-confirm").dialog("open");
   }
   
   function deleteProtocolEntry() {
      var protId = $(this).data("protid");
      showConfirmDialog(protId, execAjaxToDeleteProtocolEntry);
   }
   
   function deleteInventoryEntry() {
      var invId = $(this).data("invid");
      showConfirmDialog(invId, execAjaxDeleteInventoryEntry);
   }
   
   var isInInvEdit = false;
   function editInventoryEntry() {
      if(!isInInvEdit) {
         isInInvEdit = true;
         $(this).off("click", editInventoryEntry);
         var oldDescr = $(this).text();
         var invId = $(this).data("invid");
         $(this).html("<input id=\"invDescEditField\" value=\""+oldDescr+"\" data-invid=\""+invId+"\">");
         $("#invDescEditField").focus();
         $("#invDescEditField").keypress(function(event) {
            // Enter
            if (event.which == 13) {
               event.preventDefault();
               saveInvListScrollPos(); 
               var descr = $("#invDescEditField").val();
               var invId = $("#invDescEditField").data("invid");
               execAjaxUpdateInventoryEntry(invId,descr);
            }
         });
         $("#invDescEditField").focusout(function () {
            saveInvListScrollPos();
            loadInventoryList();
         });
      }
   }
   
   function initInventoryFilter() {
      $("#invfilterdelete").click(function() {
         $("#inventory_filter").val("");
         $("#invfilterdelete").hide();
         loadInventoryList();
      });
      $("#inventory_filter").keypress(function(event) {
         var filterString = $("#inventory_filter").val();
         // Enter
         if (event.which == 13) {
            event.preventDefault();
            loadInventoryList();
         }
         if(filterString != "") {
            $("#invfilterdelete").show();
         } else {
            $("#invfilterdelete").hide();
         }
      });
   }
   
   function showPriceVersions() {
      var invId = $(this).data("invid");
      execAjaxShowInventoryPriceVersions(invId);
   }
   
   function saveInvListScrollPos() {
      scrollPosInvList = $(".bodyInv").scrollTop();
   }
   
   function restoreInvListScrollPos() {
      if(scrollPosInvList != -1) {
         $(".bodyInv").scrollTop(scrollPosInvList);
         scrollPosInvList = -1;
      }
   }
   
   function execAjaxToDeleteProtocolEntry(protId) {
      execAjax({ action: "deleteProtocolEntry", ProtocolID: protId }, protocolEntryDeleted);
   }
   
   function execAjaxDeleteInventoryEntry(invId) {
      execAjax({ action: "deleteInventoryEntry", InventoryID: invId }, inventoryEntryUpdated);
   }
   
   function execAjaxUpdateInventoryEntry(invId, descr) {
      execAjax({ action: "updateInventoryEntry", InventoryID: invId, Description: descr }, inventoryEntryUpdated);
   }
   
   function execAjaxShowInventoryPriceVersions(invId) {
      execAjax({ action: "getInventoryVersions", InventoryID: invId }, processReceivedInventoryVersions);
   }
   
   // save a new protocol-entry
   function saveProtocolEntry() {
      clearErrors();
      var dataToSend = prepareDataForAddProtocolEntry();
      if(dataToSend == null) {
         return;
      }
      enableInput(false);
      execAjax(dataToSend, protocolEntrySaved);
      loadProtocolList();
   }
   
   // check all input-values for a new protocol-entry and create data to be send to server
   function prepareDataForAddProtocolEntry() {
      var invId = $("#invid").val();
      var dateTime = $("#datetime").val();
      var inventory = $("#inventory").val();
      var price = $("#price").val().replace(",",".");
      var inputErrors = 0;
      inputErrors += checkForValidCondition(isValidDateTime(dateTime), "#datetime", "Falsches Datumsformat! Bitte DD.MM.YYYY verwenden.<br>");
      inputErrors += checkForValidCondition(isValidInventory(inventory), "#inventory", "Bitte ein Essen auswählen oder neu eingeben.<br>");
      inputErrors += checkForValidCondition(isValidPrice(price), "#price", "Bitte Preis als Ziffern eingeben und Punkt als Dezimaltrenner verwenden.<br>");
      if(inputErrors > 0) {
         showErrors();
         return null;
      }
      var dataToSend = {
            action: "addProtocolEntry",
            InventoryID: invId,
            Description: inventory,
            Price: price,
            DateTime: toServerDateFormat(dateTime)
         };
      return dataToSend;
   }
   
   // enable the highlighting of a row when the mouse-pointer enters the row
   function enableHoverRow(tableClass) {
      $("div."+tableClass+" div.hover").hover(
         function(){ $(this).children().css("background-color","#ddd");}, 
         function(){ $(this).children().css("background-color","");});
   }
   
   function enableFilterRow(tableClass) {
      $("div."+tableClass+" div.hover").click(
         function(){ 
            selectedYear = $(this).data("year");
            selectedMonth = $(this).data("month");
            showProtFilter();
            loadProtocolList();
         });
   }
   
   function showProtFilter() {
      $("#protfilter-headline").html("im " + MonthNames[selectedMonth - 1] + " " + selectedYear);
      $("#protfilter").html("Alle Essen anzeigen");
      $("#protfilter").click(function() {
         $("#protfilter,#protfilter-headline").hide();
         selectedYear = null;
         selectedMonth = null;
         loadProtocolList();
      });
      $("#protfilter,#protfilter-headline").show();
   }

   function enableHeaderSort(tableClass) {
      $("div."+tableClass+" div.head").click(function(){ 
         var orderby = $(this).data("orderby");
         if(orderby != null && orderby != "") {
            var orderStoreItem = $(this).parent().parent();
            var prevOrderBy = orderStoreItem.data("orderby");
            var orderdir = orderStoreItem.data("orderdir");
            var newOrderDir = "asc";
            if(prevOrderBy == orderby)
            {
               if(orderdir != null && orderdir == "desc") {
                  newOrderDir = "asc";
               } else {
                  newOrderDir = "desc";
               }
            }
            orderStoreItem.data("orderdir", newOrderDir);
            orderStoreItem.data("orderby",orderby);
            loadInventoryList();
         }
      })
      .css("cursor","pointer");
   }
   
   function getSortIndicator(currCol,orderby,orderdir) {
      if(currCol == orderby) {
         if(orderdir == "asc") {
            return "&nbsp;&darr;";
         } else if(orderdir == "desc") {
            return "&nbsp;&uarr;";
         }
      }
      return "";
   }
   
   // print number together with correct word
   function getNumEntriesMsg(num) {
      return "" + num + (num == 1 ? " Eintrag" : " Einträge");
   }
   
   // process received list of inventory-entries: generate HTML and display it
   function processReceivedInventoryList(data) {
      var invList = checkAjaxResult(data);
      $("#inventory_list").text("");
      isInInvEdit = false;
      if(invList != null) {
         InventoryList = [];
         var orderby = $("#inventory_list").data("orderby");
         var orderdir = $("#inventory_list").data("orderdir");
         var tableHtml = 
            "<div class=\"table tableInv\">"+
               "<div class=\"col colFood head\" data-orderby=\"description\">Essen"+getSortIndicator("description",orderby,orderdir)+"</div>"+
               "<div class=\"col colPrice head\" data-orderby=\"price\">Preis"+getSortIndicator("price",orderby,orderdir)+"</div>"+
               "<div class=\"col colNum head\" data-orderby=\"cnt\">Anzahl"+getSortIndicator("cnt",orderby,orderdir)+"</div>"+
               "<div class=\"col colDelete head\">&nbsp;</div>"+
            "<div class=\"body bodyInv\">";            
         for(var idx = 0; idx < invList.length; idx++) {
            var invEntry = invList[idx];
            InventoryList.push({ value: invEntry.Description, label: invEntry.Description + " | " + invEntry.Price, price: invEntry.Price, id: invEntry.ID });
            var columns = 
               "<div class=\"col colFood colFoodEdit\" data-invid=\"" + invEntry.ID + "\">" + invEntry.Description + "</div>" +
               "<div class=\"col colPrice colPriceClick\" data-invid=\"" + invEntry.ID + "\">" + invEntry.Price + "</div>" +
               "<div class=\"col colNum\">" + invEntry.Count + "</div>" +
               "<div class=\"col colDelete\">" + 
                  "<span class=\"deleteinv\" data-invid=\"" + invEntry.ID + "\" title=\"Eintrag löschen\">X</span>"+
               "</div>";
            tableHtml += "<div class=\"hover clear\">"+columns+"</div>";
         }
         tableHtml += "</div></div>";
         tableHtml += "<div class=\"numvalues\">"+getNumEntriesMsg(invList.length)+"</div>";
         $("#inventory_list").html(tableHtml);
         restoreInvListScrollPos();
         $(".deleteinv").on("click", deleteInventoryEntry);
         $(".colFoodEdit").on("click", editInventoryEntry);
         $(".colPriceClick").on("click", showPriceVersions);
         $("#inventory").autocomplete("option", "source", InventoryList);
         enableHoverRow("tableInv");
         enableHeaderSort("tableInv");
      }
   }
   
   // process received list of protocol-entries: generate HTML and display it
   function processReceivedProtocolList(data) {
      var protList = checkAjaxResult(data);
      $("#protocol_list").text("");
      if(protList != null) {
         var tableHtml = 
            "<div class=\"table tableProt\">"+
               "<div class=\"col colDate head\">Datum</div>"+
               "<div class=\"col colFood head\">Essen</div>"+
               "<div class=\"col colPrice head\">Preis</div>"+
               "<div class=\"col colDelete head\">&nbsp;</div>"+
            "<div class=\"body bodyProt\">";
         for(var idx = 0; idx < protList.length; idx++) {
            var protEntry = protList[idx];
            var columns = 
               "<div class=\"col colDate\">" + toClientDateFormat(protEntry.DateTime) + "</div>" +
               "<div class=\"col colFood\">" + protEntry.Description + "</div>" +
               "<div class=\"col colPrice\">" + protEntry.Price + "</div>" +
               "<div class=\"col colDelete\">" + 
                  "<span class=\"deleteprot\" data-protid=\""+protEntry.ProtocolID + "\" title=\"Eintrag löschen\">X</span>"+
               "</div>";
            tableHtml += "<div class=\"hover clear\">"+columns+"</div>";
         }
         tableHtml += "</div></div>";
         tableHtml += "<div class=\"numvalues\">"+getNumEntriesMsg(protList.length)+"</div>";
         $("#protocol_list").html(tableHtml);
         $(".deleteprot").on("click", deleteProtocolEntry);
         enableHoverRow("tableProt");
      }
   }
   
   // process received list of protocol-sum-entries: generate HTML and display it
   function processReceivedProtocolSumList(data) {
      var protList = checkAjaxResult(data);
      $("#protocol_sum_list").text("");
      if(protList != null) {
         var tableHtml = "<div class=\"table tableSum\">"+
               "<div class=\"col colYear head\">Jahr</div>"+
               "<div class=\"col colMonth head\">Monat</div>"+
               "<div class=\"col colPrice head\">Summe</div>"+
            "<div class=\"body bodySum\">";
         for(var idx = 0; idx < protList.length; idx++) {
            var protEntry = protList[idx];
            var selData = "data-year=\""+protEntry.Year+"\" data-month=\""+protEntry.Month+"\"";
            var columns = 
               "<div class=\"col colYear\">" + protEntry.Year + "</div>" +
               "<div class=\"col colMonth\">" + MonthNames[protEntry.Month - 1] + "</div>" +
               "<div class=\"col colPrice\">" + protEntry.Sum + "</div>";
            tableHtml += "<div class=\"hover clear\""+selData+">"+columns+"</div>";
         }
         tableHtml += "</div></div>";
         $("#protocol_sum_list").html(tableHtml);
         enableHoverRow("tableSum");
         enableFilterRow("tableSum");
      }
   }
   
   function processReceivedInventoryVersions(data) {
      var priceList = checkAjaxResult(data);
      var priceStringList = "";
      var invDescr = "";
      for(var idx = 0; idx < priceList.length; idx++) {
         var priceEntry = priceList[idx];
         invDescr = priceEntry.Description;
         priceStringList += "<br>" + toClientDateFormat(priceEntry.DateTime) + " : " + priceEntry.Price;
      }
      showInfoDialog("Preisentwicklung für <br><span class=\"dlg-food\">"+invDescr + "</span>:<br>" + priceStringList);
   }
   
   function setupInfoDialog() {
      $("#dialog-info").dialog({
         modal: true,
         autoOpen: false,
         minWidth: 400,
         buttons: {
           Ok: function() {
             $( this ).dialog("close");
           }
         }
       });      
   }
   
   function showInfoDialog(content) {
      $("#dialog-info-content").html(content);
      $("#dialog-info").dialog("open");
   }

   // enable/disable all input fields and buttons
   function enableInput(enable) {
      $("#datetime,#inventory,#price,#save").prop('disabled', !enable);
   }
   
   // convert 'dd.mm.yyyy' to 'yyyy-mm-dd'
   function toServerDateFormat(dateTime) {
      var strParts = dateTime.split(".");
      return strParts[2]+"-"+strParts[1]+"-"+strParts[0];
   }
   
   // convert 'yyyy-mm-dd' to 'dd.mm.yyyy'
   function toClientDateFormat(dateTime) {
      var strParts = dateTime.split("-");
      return strParts[2]+"."+strParts[1]+"."+strParts[0];
   }
   
   // execute the ajax-call
   function execAjax(dataToSend,successFunc,errorFunc) {
      if(errorFunc == null) {
         errorFunc = checkAjaxResult
      }
      $.ajax({
            url: "essen_ajax.php",
            data: dataToSend,
            success: successFunc,
            error: errorFunc
         });
   }
   
   // action to be done when ajax-call to save protocol-entry finished
   function protocolEntrySaved(data) {
      checkAjaxResult(data);
      enableInput(true);
      $("#invid").val("-1");
      $("#inventory,#price").val("");
      loadProtocolList();
      loadProtocolSumList();
      loadInventoryList();
   }
   
   // action to be done when ajax-call to delete protocol-entry finished
   function protocolEntryDeleted(data) {
      checkAjaxResult(data);
      loadProtocolList();
      loadProtocolSumList();
   }
   
   // action to be done when ajax-call to delete inventory-entry finished
   function inventoryEntryUpdated(data) {
      checkAjaxResult(data);
      loadInventoryList();
   }
   
   // check for valid inventory input
   function isValidInventory(inventoryValue) {
      if(inventoryValue == null) {
         return false;
      }
      var valid = inventoryValue.match(/^[\w\s\d\W]{5,}$/);
      return (valid != null && valid.length > 0);
   }
   
   // check for valid date input
   function isValidDateTime(dateTimeValue) {
      if(dateTimeValue == null) {
         return false;
      }
      var valid = dateTimeValue.match(/^(\d{1,2}).(\d{1,2}).(\d{4})$/);
      return (valid != null && valid.length > 0);
   }
   
   // check for valid price input
   function isValidPrice(priceValue) {
      if(priceValue == null) {
         return false;
      }
      var valid = priceValue.match(/^(\d+)(.\d{0,2}){0,1}$/);
      return (valid != null && valid.length > 0);
   }
   
   // clear previous errors and hide the error-pane
   function clearErrors() {
      $("#price,#inventory,#datetime").removeClass("input-error");
      $("#error-messages-text").html("");
      $("#error-messages").hide();
   }
   
   // if condition is not valid add errorMsg to list of messages to be displayed later on
   function checkForValidCondition(condition,inputSelector,errorMsg) {
      if(!condition) {
         $("#error-messages-text").append(errorMsg);
         $(inputSelector).addClass("input-error");
         return 1;
      }
      return 0;
   }
   
   // show input errors
   function showErrors(errorMsg) {
      if(errorMsg != null) {
         $("#error-messages-text").append(errorMsg);
      }
      $("#error-messages").show();
   }
   
   // check data returned by ajax-call
   function checkAjaxResult(data) {
      if(data == null) {
         console.log("checkAjaxResult: data is NULL");
         return null;
      }
      var result = JSON.parse(data)
      if(result.success) {
         //console.log("Ajax successful: "+result.message);
         return result.data;
      } else {
         alert("Fehler bei der Verarbeitung der Anfrage auf dem Server!\n\nDetails:\n"+result.message);
         return null;
      }
   }
   
   // Debug-helper to print out any object/value
   function myObj2Str(theObject, paramident) {
       var ident = typeof paramident !== 'undefined' ? paramident : '';
       var output = '';
       if (typeof theObject === 'object' && typeof theObject != 'file') {
           for (var property in theObject) {
               if (typeof theObject[property] === 'object') {
                   output += ident + property + ':\n' + myObj2Str(theObject[property], ident + '   ');
               }
               else if (typeof theObject[property] === 'function') {
                   output += ident + property + ': (function)\n';
               } else if (typeof theObject != 'file') {
                   output += ident + property + ': ' + theObject[property] + '\n';
               }
           }
       }
       else if (typeof theObject === 'function') {
           output += ident + '(function)\n';
       }
       else if (typeof theObject != 'file') {
           output += ident + theObject + '\n';
       }
       return output;
   }
