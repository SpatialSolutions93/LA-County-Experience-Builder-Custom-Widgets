export const fetchDataFromGoogleSheet = (
  apiKey: string,
  sheetId: string
): Promise<any[]> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/AboutTheLayersUpdateCurrent?key=${apiKey}`;

  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      console.log("Data from Google Sheets: ", data.values);
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
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      if (!sheetData.length) {
        throw new Error("Sheet data is not loaded yet.");
      }

      // Assuming that the first row in the sheet contains headers
      const headers = sheetData[0];
      const codeNameIndex = headers.indexOf("CodeNameReference");
      const codeDescriptionIndex = headers.indexOf("CodeDescriptionReference");

      if (codeNameIndex === -1 || codeDescriptionIndex === -1) {
        throw new Error("Required columns not found in the sheet");
      }

      // Find the row where CodeNameReference matches the datasetName
      const matchingRow = sheetData.find(
        (row) => row[codeNameIndex] === datasetName
      );

      if (matchingRow) {
        // Resolve with the value from the CodeDescriptionReference column
        resolve(matchingRow[codeDescriptionIndex]);
      } else {
        console.warn("No matching dataset name found in the sheet.");
        resolve(""); // Resolve with an empty string if no match is found
      }
    } catch (error) {
      console.error("Error processing data from Google Sheets:", error);
      reject(error);
    }
  });
};
