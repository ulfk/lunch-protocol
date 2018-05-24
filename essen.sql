--
-- Create tables for 'essen'-application
--

CREATE TABLE IF NOT EXISTS `inventory` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(128) COLLATE latin1_german1_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `active` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 COLLATE=latin1_german1_ci AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS `protocol` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `datetime` date NOT NULL,
  `InventoryID` int(11) NOT NULL,
  `Remarks` varchar(255) COLLATE latin1_german1_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 COLLATE=latin1_german1_ci AUTO_INCREMENT=1 ;
