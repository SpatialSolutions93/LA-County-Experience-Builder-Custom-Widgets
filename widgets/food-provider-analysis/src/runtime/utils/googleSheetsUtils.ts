export const fetchDataFromGoogleSheet = (
  apiKey: string,
  sheetId: string
): Promise<any[]> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/AboutTheLayersUpdateCurrent?key=${apiKey}`;

  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      return data.values || [];
    })
    .catch((error) => {
      console.error("Error fetching data from Google Sheets:", error);
      return [];
    });
};

export const findDataFromGoogleSheet = (
  sheetData: any[],
  datasetName: string
): Promise<{ description: string; units: string | null }> => {
  return new Promise((resolve, reject) => {
    try {
      if (!sheetData.length) {
        throw new Error("Sheet data is not loaded yet.");
      }

      // Assuming that the first row in the sheet contains headers
      const headers = sheetData[0];
      const codeNameIndex = headers.indexOf("CodeNameReference");
      const codeDescriptionIndex = headers.indexOf("CodeDescriptionReference");
      const dataUnitsIndex = headers.indexOf("DataUnits"); // Added this line

      if (
        codeNameIndex === -1 ||
        codeDescriptionIndex === -1 ||
        dataUnitsIndex === -1 // Added this line
      ) {
        throw new Error("Required columns not found in the sheet");
      }

      // Find the row where CodeNameReference matches the datasetName
      const matchingRow = sheetData.find(
        (row) => row[codeNameIndex] === datasetName
      );

      if (matchingRow) {
        // Get the description and units
        const description = matchingRow[codeDescriptionIndex];
        const units = matchingRow[dataUnitsIndex] || null; // Get units or null if empty
        resolve({ description, units });
      } else {
        console.warn("No matching dataset name found in the sheet.");
        resolve({ description: "", units: null }); // Return empty values if no match is found
      }
    } catch (error) {
      console.error("Error processing data from Google Sheets:", error);
      reject(error);
    }
  });
};
