<?php

$databaseHandle = null;
$databaseError = "";

include "essen_config.php";
include "essen_functions.php";

$localeToBeUsed = "deu";

if (!setlocale(LC_TIME, $localeToBeUsed))
{
   returnError("Failed to set locale to '".$localeToBeUsed."'");
   exit;
}

/* connect to database */
dbConnect();

/* execute the action */
executeAction(getParReq("action",""));

dbDisconnect();

?>