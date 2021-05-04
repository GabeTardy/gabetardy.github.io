class StationSub {
    $Name
    $Default
    $AnnouncementStyle <# Integer returning index of announcement filename in station complex array of announcement possibilities #>
    $Platforms = @()

    StationSub($_name){
        $this.Name = $_name
        $this.Default = $false
    }

    AddPlatform($id){
        $this.Platforms += $id
    }

    RemovePlatform($id){
        $this.Platforms -= $id
    }

    SetAnnouncementStyle($index){
        $this.AnnouncementStyle = $index
    }
}

class StationComplex {
    $SubStations = @()
    $AnnouncementStyles = @()

    $Name
    $Mode <# 0: simple, station uses substation as main station, 1: complex: station uses multiple substations with own announcement styles #>
    $DeleteMetadata = $false
    $ID

    StationComplex($_name, $_mode, $_incitingPlatformID){ <# platform id is given by the platform when the station itself is created #>
        $this.Name = $_name
        $this.Mode = $_mode <# should default to simple #>

        $DefaultSubStation = [StationSub]::new($this.Name)
        $DefaultSubStation.Default = $true
        $DefaultSubStation.AddPlatform($_incitingPlatformID)

        $this.SubStations += $DefaultSubStation

        $global:PlatformsToStationsMap[$_incitingPlatformID] = $global:StationComplexList.Count
        $this.ID = $global:StationComplexList.Count
        <# Sneaky, potential bug alert: the station complex list count isn't incremented until AFTER the constructor runs in powershell. please confirm in c#. #>
    }

    [string]ToString(){
        return $this.SubStations[0].Name
    }

    AddAnnouncementStyle($filename){
        <# get filename, add to list #>
        $this.AnnoucementStyles += $filename
    }

    RemoveAnnouncementStyle($index){
        <# remove from list at given index #>
        <# can't be bothered to implement this in powershell. just take my word for it. #>
    }

    AddSubstation($ipi){
        AddSubstation($ipi, $false)
    }

    AddSubstation($incitingPlatformID, $default){
        $NSS = [StationSub]::new($this.Name)
        $NSS.Default = $true

        $this.SubStations += $NSS
        if($incitingPlatformID -ne $null) { $this.AddSubstation($incitingPlatformID, $this.SubStations.Count - 1) }

        
    }

    AddPlatform($platform_id){
        $this.AddPlatform($platform_id, 0)
    }

    AddPlatform($platform_id, $substation_id){
        if($this.SubStations[$substation_id] -eq $null){
            $this.AddSubstation($platform_id)
        }else{
            $this.SubStations[$substation_id].AddPlatform($platform_id)
            $global:PlatformsToStationsMap[$platform_id] = $this.ID
        }

    }

    MergeWithStation($_mode, $id_of_station_to_merge_with){
        <# modes: 0: merge substation list with other substation list, 1: flatten and make new substation 2: flatten and merge with substation 0, 3: with substation 1, etc. #>
        
        <# somewhere have a garbage collector loop that gets rid of station metadata marked for gc #>
        $this.DeleteMetadata = $true
    }
}

class LineStop {
    $OutboundInboundBoth <# 0, 1, 2 respectively #>
    $WhichPlatform
    $StationID
    $StationLiteral

    LineStop($OIB, $_which, $_id){
        $this.OutboundInboundBoth = $OIB
        $this.WhichPlatform = $_which
        $this.StationID = $_id
        $this.StationLiteral = $global:StationComplexList[$this.StationID];
    }

    [string]ToString(){
        if($this.StationLiteral.Mode -eq 1){
            $SubStation = "";
            for($i = 0; $i -lt $this.StationLiteral.SubStations.Count; $i++){
                if($this.StationLiteral.SubStations[$i].Platforms -contains $this.WhichPlatform){
                    $SubStation = $this.StationLiteral.SubStations[$i].Name;
                }
            }
            return $this.StationLiteral.Name + "[" + $this.SubStation + "]"
        } else {
            return $this.StationLiteral.Name
        }
    }
}

class Line {
    <# To be especially clear, heading "inbound" refers to going backwards through the array before the outbound terminus, and forwards through the array thereafter. #>
    $Name
    $StationListRaw = @()
    $StationList = @()

    $InboundTerminus # index in array
    $OutboundTerminus # index in array

    $DeleteMetadata = $false

    Line($_name, $_stations, $_first, $_last){
        $this.Name = $_name

        $this.InboundTerminus = $_first
        $this.OutboundTerminus = $_last

        $this.StationListRaw = $_stations
        $this.ParseStationList()
    }

    [string]ToString(){
        return ($this.Name + ": " + ($this.StationList -join ", "))
    }

    ParseStationList(){
        <# Take raw station loop and turn it into a line #>

        $RawBackup = $this.StationListRaw

        <# First make sure that the first element is actually the terminus. #>
        if($this.InboundTerminus -ne 0){
            $this.StationListRaw = $this.StationListRaw[$this.InboundTerminus..$this.StationListRaw.Count] + $this.StationListRaw[0..($this.InboundTerminus-1)]
            $this.OutboundTerminus -= $this.InboundTerminus;
            $this.InboundTerminus = 0;
        }

        $Station = $global:PlatformsToStationsMap[$this.StationListRaw[$this.InboundTerminus]];
        $NewLineStop = [LineStop]::new(2, $this.StationListRaw[$this.InboundTerminus], $Station)
        $this.StationList += $NewLineStop

        $Outbound = $this.StationListRaw[1..($this.OutboundTerminus-1)];
        $Inbound = $this.StationListRaw[($this.StationListRaw.Count-1)..($this.OutboundTerminus+1)]; <# Inbound array is flipped !!!!! #>

        $idx_outbound = 0
        $idx_inbound = 0
        $last_found_idx = 0
        while($idx_inbound -lt $Inbound.Count){
            "(" + $Outbound[$idx_outbound] + "), " + "(" + $Inbound[$idx_inbound] + ")" | Out-Host
            ((Get-Sta($Outbound[$idx_outbound])).Name + "(" + $Outbound[$idx_outbound] + "), " + (Get-Sta($Inbound[$idx_inbound])).Name) + "(" + $Inbound[$idx_inbound] + ")" | Out-Host
            if($global:PlatformsToStationsMap[$Inbound[$idx_inbound]] -ne $global:PlatformsToStationsMap[$Outbound[$idx_outbound]]){
                if($idx_outbound -eq $Outbound.Count - 1){
                    "hi" | Out-Host
                    <# This station must be inbound-only since it is not found in the outbound array. #>
                    $Station = $global:PlatformsToStationsMap[$Inbound[$idx_inbound]]
                    $NewLineStop = [LineStop]::new(1, $Inbound[$idx_inbound], $Station)
                    $this.StationList += $NewLineStop
                    $idx_inbound++
                    $idx_outbound = $last_found_idx + 1
                }
                $idx_outbound++
            }else{
                <# Both directions! They are equal. Now let's fill in the gaps. #>
                for($catchup = $last_found_idx + 1; $catchup -lt $idx_outbound; $catchup++){
                    $Outbound[$catchup] | Out-Host
                    $Station = $global:PlatformsToStationsMap[$Outbound[$catchup]]
                    $NewLineStop = [LineStop]::new(0, $Outbound[$catchup], $Station);
                    $this.StationList += $NewLineStop
                }

                $Station = $global:PlatformsToStationsMap[$Inbound[$idx_inbound]]
                $NewLineStop = [LineStop]::new(2, $Inbound[$idx_inbound], $Station)
                $this.StationList += $NewLineStop
                $last_found_idx = $idx_outbound
                $idx_inbound++

                if($last_found_idx -eq $Outbound.Count - 1){
                    for($proceed = $idx_inbound; $proceed -lt $Inbound.Count; $proceed++){
                        $Station = $global:PlatformsToStationsMap[$Inbound[$idx_inbound]]
                        $NewLineStop = [LineStop]::new(1, $Inbound[$idx_inbound], $Station)
                        $this.StationList += $NewLineStop
                        $idx_inbound++
                    }
                }
            }
        }

        $Station = $global:PlatformsToStationsMap[$this.StationListRaw[$this.OutboundTerminus]];
        $NewLineStop = [LineStop]::new(2, $this.StationListRaw[$this.OutboundTerminus], $Station)
        $this.StationList += $NewLineStop
    }
}

function Do-GarbageCollect(){
    $StationWasRemoved = $false
    $LineWasRemoved = $false

    for($i = $StationComplexList.Count - 1; $i -ge 0; i--){
        if($StationComplexList[$i].DeleteMetadata){
            for($j = 0; $j -lt $StationComplexList[$i].SubStations.Count; $j++){
                for($k = 0; $k -lt $StationComplexList[$i].SubStations[$j].Platforms.Count; $k++){
                    $PlatformsToStationsMap[$StationComplexList[$i].SubStations[$j].Platforms[$k]] = 0;
                }
            }
            $StationComplexList.RemoveAt($i);
        }
    }

    for($i = $LinesList.Count - 1; $i -ge 0; i--){
        if($LinesList[$i].DeleteMetadata){
            $LinesList.RemoveAt($i);
            <# Remove all platforms contained in this line from stations. Additionally, remove these platforms from the platform-to-station map. #>
        }
    }

    if($StationWasRemoved){
        Map-PlatformsToStations
    }
}

function Map-PlatformsToStations(){
    $PlatformsToStationsMap = New-Object int[] 32768;

    <# Why do we go backwards? Because I am to lazy to not copy this. #>
    for($i = $StationComplexList.Count - 1; $i -ge 0; i--){
        for($j = 0; $j -lt $StationComplexList[$i].SubStations.Count; $j++){
            for($k = 0; $k -lt $StationComplexList[$i].SubStations[$j].Platforms.Count; $k++){
                $PlatformsToStationsMap[$StationComplexList[$i].SubStations[$j].Platforms[$k]] = $i;
            }
        }
    }
}

function Get-Sta($plat){
    return $StationComplexList[$PlatformsToStationsMap[$plat]];
}

$PlatformsToStationsMap = New-Object int[] 32768;
$StationComplexList = @([StationComplex]::new("DUMMY", 0, 0))
$LinesList = @()


$StationComplexList += [StationComplex]::new("West Bingham Street", 0, 25516)
$StationComplexList += [StationComplex]::new("Cora Road", 0, 6215)
$StationComplexList[2].AddPlatform(2305)
$StationComplexList += [StationComplex]::new("Maybelline Street", 0, 8441)
$StationComplexList[3].AddPlatform(26442)
$StationComplexList += [StationComplex]::new("Carolina Avenue", 0, 2918)
$StationComplexList[4].AddPlatform(29181)
$StationComplexList += [StationComplex]::new("East 22nd Road", 0, 25901)
$StationComplexList += [StationComplex]::new("East 36th Road", 0, 1648)
$StationComplexList[6].AddPlatform(26448)
$StationComplexList += [StationComplex]::new("East 42nd Road", 0, 1)
$StationComplexList[7].AddPlatform(31)

$ComplexExample = [StationComplex]::new("Carson Glen", 1, 32)
$ComplexExample.AddPlatform(64, 0)
$ComplexExample.AddPlatform(128, 1)
$ComplexExample.SubStations[0].Name = "Carson Glen - East Forrest Street";
$ComplexExample.SubStations[1].Name = "East 53rd Road - Carson Glen";

$StationComplexList += $ComplexExample


$LinesList += [Line]::new("Line 1", @(32, 2305, 25516, 6215, 64, 8441, 2918, 26442), 2, 6)
$LinesList += [Line]::new("Line 2", @(29181, 25901, 1648, 1, 128, 31, 26448), 0, 3)

$idx = 0;
$StationComplexList | Format-Table -Property @{name="Index";expression={$global:idx;$global:idx+=1}}, Name, SubStations, Mode, AnnouncementStyles, DeleteMetadata

$LinesList[0].StationList | Format-Table -Property StationLiteral, StationID, WhichPlatform, OutboundInboundBoth
$LinesList[1].StationList | Format-Table -Property StationLiteral, StationID, WhichPlatform, OutboundInboundBoth