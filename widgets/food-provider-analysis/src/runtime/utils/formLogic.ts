import React from "react";

export const useDatasetChangeHandler = (
  selectedDatasets,
  setSelectedDatasets
) => {
  const handleDatasetChange = (datasetId) => {
    if (selectedDatasets.includes(datasetId)) {
      setSelectedDatasets((prev) => prev.filter((id) => id !== datasetId));
    } else {
      setSelectedDatasets((prev) => [...prev, datasetId]);
    }
  };

  return handleDatasetChange;
};

// Types for lists and setter functions
type DropdownListsType = {
  neighborhoodList: any[];
  cityList: any[];
  censusTractList: any[];
  cityCouncilDistrictsList: any[];
  servicePlanningAreaList: any[];
  supervisorDistrictList: any[];
  CSAList: any[];
};

type SetSelectedRecordType = React.Dispatch<React.SetStateAction<any>>; // Adjust 'any' as necessary

// The function
export const handleDropdownChange = (
  event: React.ChangeEvent<HTMLSelectElement>,
  boundaryType: string,
  lists: DropdownListsType,
  setSelectedRecordIndex: React.Dispatch<React.SetStateAction<string>>,
  setSelectedRecord: SetSelectedRecordType
) => {
  const selectedIndex = event.target.value;
  setSelectedRecordIndex(selectedIndex);

  let record;
  switch (boundaryType) {
    case "Neighborhood":
      record = lists.neighborhoodList[Number(selectedIndex)];
      break;
    case "City":
      record = lists.cityList[Number(selectedIndex)];
      break;
    case "Census Tract":
      record = lists.censusTractList[Number(selectedIndex)];
      break;
    case "LA City Council District":
      record = lists.cityCouncilDistrictsList[Number(selectedIndex)];
      break;
    case "Service Planning Area (SPA)":
      record = lists.servicePlanningAreaList[Number(selectedIndex)];
      break;
    case "Supervisor District":
      record = lists.supervisorDistrictList[Number(selectedIndex)];
      break;
    case "Countywide Statistical Area (CSA)":
      record = lists.CSAList[Number(selectedIndex)];
      break;
    default:
      record = undefined;
  }

  // Set the selected record if found
  if (record) {
    setSelectedRecord(record);
  }
};
