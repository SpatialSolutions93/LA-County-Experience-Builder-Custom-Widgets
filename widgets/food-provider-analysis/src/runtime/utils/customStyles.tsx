// customStyles.ts
import { CSSProperties } from "react";

export const mapStyle: CSSProperties = {
  position: "absolute",
  top: "25%",
  left: "25%",
  width: "669.12px",
  height: "500px",
  backgroundColor: "white",
  border: "0px solid black",
  visibility: "hidden",
};

export const reportButtonStyle: CSSProperties = {
  position: "absolute",
  top: "131px",
  left: "15px",
  zIndex: 6000,
  boxShadow: "rgba(0, 0, 0, 0.2) 0px 1px 2px 0px",
  pointerEvents: "auto",
};

export const viewReportButtonStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: "bold",
  transition: "background-color 0.3s ease, color 0.3s ease",
  backgroundColor: "#f5f5f5",
  color: "black",
  border: "1px solid #ccc",
  padding: "10px 20px",
  cursor: "pointer",
};

export const viewReportButtonHoverStyle: CSSProperties = {
  backgroundColor: "lightgreen",
  border: "1px solid #009c0a",
};

export const viewUseCaseButtonStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: "bold",
  transition: "background-color 0.3s ease, color 0.3s ease",
  backgroundColor: "#f5f5f5",
  color: "black",
  border: "1px solid #ccc",
  padding: "10px 20px",
  cursor: "pointer",
};

export const viewUseCaseButtonHoverStyle: CSSProperties = {
  backgroundColor: "lightgreen",
  border: "1px solid #009c0a",
};

export const reportFormStyle: CSSProperties = {
  width: "calc(100% - 300px)",
  margin: "0 150px",
  marginTop: "20px",
  height: "auto",
  overflow: "auto",
  visibility: "hidden",
  backgroundColor: "white",
  border: "1px solid black",
  padding: "20px",
  boxSizing: "border-box",
  pointerEvents: "auto",
  position: "absolute",
  zIndex: 1000,
  bottom: "36%",
};

export const useCaseFormStyle: CSSProperties = {
  width: "calc(100% - 300px)",
  margin: "0 150px",
  marginTop: "20px",
  height: "auto",
  overflow: "auto",
  visibility: "hidden",
  backgroundColor: "white",
  border: "1px solid black",
  padding: "20px",
  boxSizing: "border-box",
  pointerEvents: "auto",
  position: "relative",
};

export const dropdownStyle: CSSProperties = {
  width: "100%",
  padding: "8px",
  marginBottom: "20px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  fontSize: "16px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  pointerEvents: "auto",
};

// Style for the container that holds both buttons
export const customContainerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center", // Center the buttons horizontally
  alignItems: "center", // Align the buttons vertically
  gap: "10px", // Space between the buttons
  position: "fixed",
  bottom: "100px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 3000,
};

// Adjust bannerStyle to remove positioning attributes since the container will handle it
export const customButtonStyle: CSSProperties = {
  backgroundColor: "#f8f8f8",
  padding: "10px 20px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  cursor: "pointer",
  pointerEvents: "auto",
};

export const customPdfCloseButton: CSSProperties = {
  margin: "10px",
  border: "1px solid rgb(204, 204, 204)",
  fontWeight: "bold",
  fontSize: "Large",
};

export const customPdfCloseButtonHover: CSSProperties = {
  backgroundColor: "#e6adad",
  border: "1px solid #ff0000",
  fontWeight: "bold",
  fontSize: "Large",
};
