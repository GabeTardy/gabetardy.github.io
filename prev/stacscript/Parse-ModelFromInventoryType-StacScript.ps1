Function Parse-InventoryTypeData-STACScript
{
	<#
		.SYNOPSIS
			Takes CSV containing inventory data and produces a best guess as to inventory model and manufacturer from inventory name.
			
		.PARAMETER CSVPath
			Path to CSV. Required.
			
		.EXAMPLE
			Parse-InventoryTypeData-STACScript -CSVPath C:\path\to\file.csv
			
		.NOTES
			Changelog:
			- 3/25/2021: Ported from original JavaScript. No clue if this works or not as a function.
			
			#>
	
	param
	(
		[Parameter(Mandatory=$true}]
		[string]$CSVPath
	)
	
	<# Quick and dirty overrides for exception cases because I can't think of a different solution #>
	$ManufacturerOverrides = "Middle Atlantic", "Polycom", "Polycam", "Epson", "Elmo", "OCTO FX2", "ocot-FX2"
	$ManufacturerOverrideNames = "Middle Atlantic", "Poly", "Poly", "EPSON", "ELMO", "Analog Way [Centrix]", "Analog Way [Centrix]"
	
	<# Validate input path #>
	if(!(Test-Path -Path $CSVPath))
	{ 
		"Queried CSV does not exist!" | Out-Host
		exit 1
	}
	
	<# Load CSV data #>
	$TableData = Get-Content $CSVPath
	
	<# Split into table form (array of arrays) by splitting first on newline then on comma #>
	$first_level_split = $TableData.Split([Environment]::NewLine)
	for($i = 0; $i -lt $first_level_split.Count; $i++){
		$row_data = $first_level_split[$i].Split(",")
		
		<# The first column contains room numbers. If the room number is not blank then this is definitely a header row. Additionally, if we already have a manufacturer and model for this inventory item, then we should skip it to save processing time. #>
		if($row_data[0] -ne "" -or $row_data[2] -eq "" -or ($row_data[4] -ne "" -and $row_data[5] -ne "")) { continue }
		
		$inventory_type = $row_data[2]
		$manufacturer = "" # $row_data[4]
		$model = "" # $row_data[5]
		
		# Special overrides
		if($inventory_type.toLower().Contains("usb hub"))
		{
			$manufacturer = "Sabrent"
		}
		else if($inventory_type.toLower().Contains("sharing switch") -or $inventory_type.toLower().Contains("usb switch"))
		{
			$manufacturer = "Sabrent"
			$model = "USB-SW20"
		}
		else if($inventory_type.toLower().Contains("ipevo"))
		{
			$manufacturer = "IPEVO"
			$model = "VZR-RHDMI"
		}
		else if($inventory_type.toLower().Contains("polycom") -and $inventory_type.toLower().Contains("camera"))
		{
			$manufacturer = "Poly"
			$model = "Poly Studio"
		}
		
		<# Guess manufacturer (if not given) #>
		if($manufacturer -eq "")
		{
			<# Try to use name overrides if possible #>
			<# Original version: 
			for($j = 0; $j -lt $ManufacturerOverrides.Count; $j++){
				if($inventory_type.toLower().Contains($ManufacturerOverrides[$j].toLower())){
					$manufacturer = $ManufacturerOverrideNames[$j]
					break
				}
			}#>
			
			$ManufacturerOverrides | %{ if($inventory_type.toLower().Contains($_.toLower()) -and $manufacturer -eq "") { $manufacturer = $ManufacturerOverrideNames[$ManufacturerOverrides.IndexOf($_)]; } }
			
			<# Case: all attempted name overrides unsuccessful, manufacturer is still blank #>
			if($manufacturer -eq "")
			{
				<# Attempt to extract manufacturer name from difference between model and inventory name #>
				if(($model -ne "") -and ($inventory_type.toLower().Contains($model.toLower())))
				{
					$manufacturer = $inventory_type.Replace($model, "")
				}
				elseif($inventory_type.Contains(" "))
				{
					<# Fallback: Manufacturer is the first word of the inventory type. #>
					$manufacturer = $inventory_type.Split(" ")[0]
				}
				else
				{
					<# This should only happen when only a single "word" is listed in the inventory type column. At this point it is difficult to make a reasonable guess as to the manufacturer. The inventory type is assumed to be a model and a warning is thrown. #>
					"Manufacturer could not be guessed. See row " + $i | Out-Host
				}
			}
		}
		
		<# Guess model (if not given) #>
		if($model -eq ""){
			if($inventory_type.toLower().Contains($manufacturer.toLower()))
			{
				$model = $inventory_type.Replace($manufacturer, "")
			}
			elseif($inventory_type.Contains(" "))
			{
				<# Fallback: Model is anything after the first word of the inventory type. #>
				$model = ($inventory_type.Split(" ") | Select-Object -Skip 1)
			}else{
				
				<# Fallback to the fallback: Inventory type is the model. A warning will be thrown, but not by this code block. #>
				$model = $inventory_type
			}
		}
		
		$row_data[4] = $manufacturer
		$row_data[5] = $model
		
		$row_data -Join "," | Out-Host
		
		$first_level_split[$i] = $row_data -Join ","
	}
	
	$TableData = $first_level_split -Join [Environment]::NewLine
	
	Set-Content $CSVPath $TableData
}