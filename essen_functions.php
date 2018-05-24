<?php

function executeAction($action)
{
   $funcList = array("listInventory",
                     "listProtocol",
                     "addInventoryEntry",
                     "addProtocolEntry",
                     "deleteInventoryEntry",
                     "deleteProtocolEntry",
                     "listProtocolSums",
                     "updateInventoryEntry",
                     "getInventoryVersions");
   if (   in_array($action,$funcList)
       && function_exists($action))
   {
      $action();
   } else {
      returnError("Unknown action: '".$action."'");
   }
}

function listInventory()
{
   $orderby = getParReq("orderby","description");
   $filterStr = getParReq("filter","");
   $result = execSqlQuery(
      "SELECT i.ID as ID,i.description as descr,i.price as price,p.cnt as cnt ".
      "FROM inventory i,".
      "  (select count(InventoryID) as cnt,InventoryID from protocol group by InventoryID) p ".
      "WHERE i.active=1 and p.InventoryID = i.ID ".
      "AND locate(?,i.description)>0 ".
      "ORDER BY ".$orderby, 
      array($filterStr));
   if(!isDatabaseError())
   {
      $resultArray = array();
      for($rowCount = 0; $rowCount < count($result); $rowCount++)
      {
         $row = $result[$rowCount];
         $resultArray[$rowCount] = array(
            'ID' => $row["ID"],
            'Description' => $row["descr"],
            'Price' => $row["price"],
            'Count' => $row["cnt"]
         );
      }
      returnSuccess("".$rowCount." rows delivered", $resultArray);
   }
   else
   {
      returnError("Failed to get inventory list: ".getDatabaseError());
   }
}

function listProtocolSums()
{
   $result = execSqlQuery("SELECT YEAR(datetime) AS year, MONTH(datetime) AS month, sum(price) AS sum ".
                          "FROM `protocol` p ".
                          "GROUP BY YEAR(datetime), MONTH(datetime)".
                          "ORDER BY YEAR(datetime) desc, MONTH(datetime) desc", array());
   if(!isDatabaseError())
   {
      $resultArray = array();
      for($rowCount = 0; $rowCount < count($result); $rowCount++)
      {
         $row = $result[$rowCount];
         $resultArray[$rowCount] = array(
            'Year' => $row["year"],
            'Month' => $row["month"],
            'Sum' => $row["sum"]
         );
      }
      returnSuccess("".$rowCount." rows delivered", $resultArray);
   }
   else
   {
      returnError("Failed to get Protocol summary list: ".getDatabaseError());
   }
}

function listProtocol()
{
   $year = getParReq("year","");
   $month = getParReq("month","");
   $result = execSqlQuery("SELECT p.ID AS ProtocolID, p.datetime AS DateTime, p.InventoryID AS InventoryID, ".
                          "p.Remarks AS Remarks, i.Description AS Description, p.price AS Price ".
                          "FROM protocol p, inventory i ".
                          "WHERE p.InventoryID = i.ID ".
                          ($year != "" ? " AND YEAR(p.datetime) = ".$year.($month != "" ? " AND MONTH(p.datetime) = ".$month : "") : "" )." ".
                          "ORDER BY p.datetime DESC", array());
   if(!isDatabaseError())
   {
      $resultArray = array();
      for($rowCount = 0; $rowCount < count($result); $rowCount++)
      {
         $row = $result[$rowCount];
         $resultArray[$rowCount] = array(
            'ProtocolID' => $row["ProtocolID"],
            'DateTime' => $row["DateTime"],
            'InventoryID' => $row["InventoryID"],
            'Remarks' => $row["Remarks"],
            'Description' => $row["Description"],
            'Price' => $row["Price"]
         );
      }
      returnSuccess("".$rowCount." rows delivered", $resultArray);
   }
   else
   {
      returnError("Failed to get protocol list: ".getDatabaseError());
   }
}

function addInventoryEntry()
{
   $description = getParReq("Description","");
   $price = getParReq("Price","");
   $inventoryId = addInventoryEntryInternal($description,$price);
   if($inventoryId != "-1") 
   {
      returnSuccess("Inventory entry inserted.");
   }
}

function addInventoryEntryInternal($description,$price)
{
   error_log("addInventoryEntryInternal: description='".$description."' price='".$price."'");
   $inventoryId = "-1";
   if($description != "" && $price != "")
   {
      $result = execSqlQuery("INSERT INTO inventory (description,price) VALUES (?,?)", array($description, $price));
      if(!isDatabaseError())
      {
         $inventoryId = getLastInsertedId();
      }
      else
      {
         returnError("Failed to insert inventory entry: ".getDatabaseError());
      }
   }
   else
   {
      returnError("addInventoryEntry: Missing arguments! (description='".$description."' price='".$price."')");
   }
   return $inventoryId;
}

function inventoryEntryExists($inventoryId)
{
   $retValue = false;
   $result = execSqlQuery("SELECT count(*) as numberofrows from inventory where ID=?", array($inventoryId));
   if(!isDatabaseError())
   {
      $retValue = ($result[0]["numberofrows"] == 1);
   }
   return $retValue;
}

function insertOrUpdateInventoryEntry($inventoryId, $description, $price)
{
   $insertEntry = true;
   if("".$inventoryId != "-1" && "".$inventoryId != "" && inventoryEntryExists($inventoryId))
   {
      $result = execSqlQuery("SELECT description,price from inventory where ID=?", array($inventoryId));
      if(!isDatabaseError() && count($result) == 1)
      {
         $insertEntry = false;
         $row = $result[0];
         $prevPrice = $row["price"];
         $prevDescription = $row["description"];
         if($prevDescription == $description && $prevPrice != $price)
         {
            $result = execSqlQuery("update inventory set price=? where id=?", array($price,$inventoryId));
         }
      }
   }
   
   if($insertEntry)
   {
      $inventoryId = addInventoryEntryInternal($description, $price);
   }
   
   return $inventoryId;
}

function addProtocolEntry()
{
   $inventoryId = getParReq("InventoryID","");
   $description = getParReq("Description","");
   $price = getParReq("Price","");
   $dateTime = getParReq("DateTime","");
   $remarks = getParReq("Remarks","");
   if($inventoryId != "" && $dateTime != "")
   {
      $inventoryId = insertOrUpdateInventoryEntry($inventoryId, $description, $price);
      if("".$inventoryId == "-1")
      {
         returnError("No InventoryID available!");
      }

      $result = execSqlQuery("INSERT INTO protocol (InventoryID,datetime,remarks,price) VALUES (?,?,?,?)", array($inventoryId, $dateTime, $remarks, $price));
      if(!isDatabaseError())
      {
         returnSuccess("Protocol entry inserted.");
      }
      else
      {
         returnError("Failed to insert protocol entry: ".getDatabaseError());
      }
   }
   else
   {
      returnError("addProtocolEntry: Missing arguments! (inventoryId='".$inventoryId."' dateTime='".$dateTime."')");
   }
}

function deleteInventoryEntry()
{
   $inventoryId = getParReq("InventoryID","");
   if($inventoryId != "")
   {
      // if entry has linked protocoll-entries: do not delete, only set to inactive
      $result = execSqlQuery("SELECT COUNT(*) AS count FROM protocol WHERE InventoryID=?", array($inventoryId));
      if(!isDatabaseError() && count($result) > 0 && $result[0]["count"] == 0)
      {
         $result = execSqlQuery("DELETE FROM inventory WHERE ID=?", array($inventoryId));
         if(!isDatabaseError())
         {
            returnSuccess("Inventory entry deleted.");
         }
         else
         {
            returnError("Failed to delete inventory entry: ".getDatabaseError());
         }
      }
      else
      {
         $result = execSqlQuery("UPDATE inventory SET active=0 WHERE ID=?", array($inventoryId));
         if(!isDatabaseError())
         {
            returnSuccess("Inventory entry set to inactive.");
         }
         else
         {
            returnError("Failed to set inventory entry to inactive: ".getDatabaseError());
         }
      }
   }
   else
   {
      returnError("deleteInventoryEntry: Missing arguments! (inventoryId='".$inventoryId."')");
   }
}

function updateInventoryEntry()
{
   $inventoryId = getParReq("InventoryID","");
   $description = getParReq("Description","");
   if($inventoryId != "" && $description != "")
   {
      $result = execSqlQuery("UPDATE inventory SET description=? WHERE ID=?", array($description,$inventoryId));
      if(!isDatabaseError())
      {
         returnSuccess("Inventory entry updated.");
      }
      else
      {
         returnError("Failed to update inventory entry: ".getDatabaseError());
      }
   }
   else
   {
      returnError("updateInventoryEntry: Missing arguments! (inventoryId='".$inventoryId."' description='".$description."')");
   }
}

function getInventoryVersions()
{
   $inventoryId = getParReq("InventoryID","");
   if($inventoryId != "")
   {
      $result = execSqlQuery("SELECT min(p.datetime) as DateTime, p.price as Price, min(i.description) as Description
                              FROM protocol p, inventory i
                              WHERE p.inventoryid = i.id
                              AND i.description = (SELECT description FROM inventory WHERE ID=?)
                              GROUP BY p.price
                              ORDER BY p.datetime", array($inventoryId));
      if(!isDatabaseError())
      {
         $resultArray = array();
         for($rowCount = 0; $rowCount < count($result); $rowCount++)
         {
            $row = $result[$rowCount];
            $resultArray[$rowCount] = array(
               'DateTime' => $row["DateTime"],
               'Description' => $row["Description"],
               'Price' => $row["Price"]
            );
         }
         returnSuccess("".$rowCount." rows delivered", $resultArray);
      }
      else
      {
         returnError("Failed to get inventory price versions: ".getDatabaseError());
      }
   }
   else
   {
      returnError("getInventoryVersions: Missing arguments! (inventoryId='".$inventoryId."')");
   }
}

function deleteProtocolEntry()
{
   $protocolId = getParReq("ProtocolID","");
   if($protocolId != "")
   {
      $result = execSqlQuery("DELETE FROM protocol WHERE ID=?", array($protocolId));
      if(!isDatabaseError())
      {
         returnSuccess("Protocol entry deleted.");
      }
      else
      {
         returnError("Failed to delete protocol entry: ".getDatabaseError());
      }
   }
   else
   {
      returnError("deleteProtocolEntry: Missing arguments! (ProtocolId='".$protocolId."')");
   }
}
   
function getParReq($name,$default)
{
   $resVal = "";
   if (isset($_REQUEST["".$name]))
      $resVal = $_REQUEST["".$name];
   else if (isset($_GET["".$name]))
      $resVal = $_GET["".$name];
   else
      $resVal = $default;
   return $resVal;
}

function dbConnect()
{
   global $databaseHandle,$db_server,$db_user,$db_password,$db_name;
   
   try {
      $databaseHandle = new PDO('mysql:host='.$db_server.';dbname='.$db_name, $db_user, $db_password);
      $databaseHandle->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
      $databaseHandle->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
   }
   catch(PDOException $e) {
      setDatabaseError($e->getMessage());
      return false;
   }        
   return true;
}

function getLastInsertedId()
{
   global $databaseHandle;
   return $databaseHandle->lastInsertId();
}

function dbDisconnect()
{
   global $databaseHandle;
   $databaseHandle = null;
}

function execSqlQuery($querystring,$params)
{
   error_log("SQL Query: ".$querystring);
   global $databaseHandle;
   $databaseError = "";
   try {
      $queryReturnsResult = strtoupper(explode(' ', $querystring)[0]) == 'SELECT';
      $results = null;
      $dbQuery = $databaseHandle->prepare($querystring);
      if($dbQuery != null) {
         $dbQuery->execute($params);
         if($queryReturnsResult) {
            $results = $dbQuery->fetchAll(PDO::FETCH_ASSOC);
         }
      }
      return $results;
   }
   catch(PDOException $e) {
      setDatabaseError($e->getMessage());
      return null;
   }
}

function setDatabaseError($param)
{
   global $databaseError;
   $databaseError = $param;
   error_log("DatabaseError: ".$param);
}

function isDatabaseError()
{
   global $databaseError;
   return $databaseError != "";
}

function getDatabaseError()
{
   global $databaseError;
   return $databaseError;
}

function returnError($message)
{
   $result = array(
      "success" => false,
      "message" => $message
   );
   echo json_encode($result);
}

function returnSuccess($infoText, $data = array())
{
   $result = array(
      "success" => true,
      "message" => $infoText,
      "data" => $data
   );
   echo json_encode($result);
}
?>