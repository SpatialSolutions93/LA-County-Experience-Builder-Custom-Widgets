import { React, DataSourceManager, DataSourceStatus, DataSourceComponent } from 'jimu-core';
import type { IMDataSourceInfo, DataSource, FeatureLayerQueryParams, AllWidgetProps } from 'jimu-core';
import { Document, Page } from 'react-pdf';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { pdfjs } from 'react-pdf';
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";

// Set the worker source for pdfjs.
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const { useRef, useState } = React;

// Set up the virtual file system for pdfMake.
pdfMake.vfs = pdfFonts.pdfMake.vfs;

/**
 * Widget component that displays a PDF report generated from a feature layer.
 * @param {AllWidgetProps<unknown>} props - The widget properties.
 * @returns {JSX.Element} The rendered widget component.
 */
export default function Widget(props: AllWidgetProps<unknown>) {
  const dsRef = useRef(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showPDFPane, setShowPDFPane] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  /**
   * Handler for document load success event.
   * @param {Object} param - The event parameters.
   * @param {number} param.numPages - The total number of pages in the document.
   */
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  /**
   * Zoom in the PDF view.
   */
  const handleZoomIn = () => {
    setZoomLevel(prevZoom => Math.min(prevZoom + 0.1, 2));
  }

  /**
   * Zoom out the PDF view.
   */
  const handleZoomOut = () => {
    setZoomLevel(prevZoom => Math.max(prevZoom - 0.1, 0.5));
  }

  /**
   * Handler for dropdown change event.
   * @param {Event} event - The event object.
   */
  const handleDropdownChange = (event) => {
    const selectedIndex = event.target.value;
    const record = records[selectedIndex];
    setSelectedRecord(record);
  };

  /**
   * Download the generated PDF report.
   */
  const handleDownload = () => {
    const blobURL = URL.createObjectURL(pdfBlob);
    const tempLink = document.createElement('a');
    tempLink.href = blobURL;
    tempLink.setAttribute('download', 'report.pdf');
    tempLink.click();
  };

  /**
   * Get the bounding box of a polygon.
   * @param {Array} rings - The rings of the polygon.
   * @returns {Object} The bounding box coordinates.
   */
  const getBoundingBox = (rings) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    rings.forEach(ring => {
      ring.forEach(point => {
        const [x, y] = point;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    });
    return { minX, minY, maxX, maxY };
  };

  /**
   * Generate a PDF report from the selected feature layer record.
   */
  const generateTestPDF = async () => {
    const featureName = selectedRecord?.feature.attributes?.name || "Unknown Name";
    const geometry = selectedRecord?.feature.geometry;

    const canvasWidth = 720;
    const canvasHeight = 540;

    // Create a canvas for the basemap
    const basemapCanvas = document.createElement('canvas');
    basemapCanvas.width = canvasWidth;
    basemapCanvas.height = canvasHeight;
    const basemapCtx = basemapCanvas.getContext('2d');

    // Fetch the tile for the entire world at zoom level 0
    const tileUrl = `https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/0/0/0`;
    const response = await fetch(tileUrl);
    const blob = await response.blob();
    const img = await createImageBitmap(blob);
    basemapCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

    const basemapImgData = basemapCanvas.toDataURL('image/png');

    // Create a canvas for the polygon
    const polygonCanvas = document.createElement('canvas');
    polygonCanvas.width = canvasWidth;
    polygonCanvas.height = canvasHeight;
    const polygonCtx = polygonCanvas.getContext('2d');

    // Draw the selected feature's polygon
    if (geometry && geometry.rings) {
      const { minX, minY, maxX, maxY } = getBoundingBox(geometry.rings);
      const width = maxX - minX;
      const height = maxY - minY;

      // Calculate the scale factor to fit the polygon within the canvas
      const scale = 0.6 * Math.min(canvasWidth / width, canvasHeight / height);

      // Calculate the translation to center the polygon on the canvas
      const translateX = (canvasWidth - width * scale) / 2 - minX * scale;
      const translateY = (canvasHeight - height * scale) / 2 - minY * scale;

      polygonCtx.beginPath();
      geometry.rings[0].forEach((point, index) => {
        const [x, y] = point;
        const canvasX = x * scale + translateX;
        const canvasY = y * scale + translateY;
        if (index === 0) {
          polygonCtx.moveTo(canvasX, canvasY);
        } else {
          polygonCtx.lineTo(canvasX, canvasY);
        }
      });
      polygonCtx.closePath();
      polygonCtx.fillStyle = 'rgba(255,0,0,0.5)';
      polygonCtx.fill();
      polygonCtx.strokeStyle = 'red';
      polygonCtx.lineWidth = 3;
      polygonCtx.stroke();
    } else {
      console.log("No geometry found for the selected record.");
    }

    const polygonImgData = polygonCanvas.toDataURL('image/png');

    const slideContent = {
      table: {
        widths: ['*'],
        heights: ['*'],
        body: [
          [
            {
              stack: [
                {
                  text: featureName,
                  fontSize: 24,
                  alignment: 'center',
                  margin: [0, 0, 0, 20],
                  fillColor: 'yellow',
                },
              ],
              border: [true, true, true, true],
              borderColor: ['red', 'red', 'red', 'red'],
              fillColor: 'blue',
            }
          ]
        ]
      },
      pageBreak: 'after'
    };

    const docDefinition = {
      content: [
        slideContent,
        {
          image: basemapImgData,
          width: canvasWidth,
          height: canvasHeight
        },
        {
          image: polygonImgData,
          width: canvasWidth,
          height: canvasHeight
        }
      ],
      pageSize: { width: canvasWidth, height: canvasHeight },
      pageOrientation: 'landscape'
    };

    if (!selectedRecord || !selectedRecord.feature || !selectedRecord.feature.geometry) {
      console.error("Invalid record or geometry. Cannot generate PDF.");
      return;
    }

    pdfMake.createPdf(docDefinition).getBlob((blob) => {
      setPdfBlob(blob);
      setShowPDFPane(true);
    });
  };

  /**
   * Handle the click event to generate the PDF report.
   */
  const handleReportClick = () => {
    generateTestPDF();
  };

  const dataRender = (ds: DataSource, info: IMDataSourceInfo) => {
    if (!ds) return null;

    dsRef.current = ds;

    const newRecords = dsRef.current.getRecords();
    if (newRecords.length !== records.length) {
      setRecords(newRecords);
    }

    const fName = props.useDataSources && props.useDataSources[0] && props.useDataSources[0].fields ? props.useDataSources[0].fields[0] : null;

    return (
      <>
        <div className="record-list" style={{ width: '100%', marginTop: '20px', height: 'calc(100% - 80px)', overflow: 'auto' }}>
          <select onChange={handleDropdownChange}>
            <option value="" disabled selected>Select a record</option>
            {records.map((record, i) => (
              <option key={i} value={i}>
                {record.getData()[fName] || "Unnamed"}
              </option>
            ))}
          </select>
          <button onClick={handleReportClick}>View Report</button>
        </div>
        {showPDFPane && (
          <div className="pdf-pane" style={{
            position: 'fixed',
            top: '12.5%',
            left: '25%',
            width: '50%',
            height: '75%',
            zIndex: 1500,
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid black',
          }}>
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <button onClick={handleZoomIn} style={{ margin: '10px' }}>+</button>
                <button onClick={handleZoomOut} style={{ margin: '10px' }}>-</button>
              </div>
              <button onClick={handleDownload} style={{ margin: '10px' }}>Download PDF</button>
              <button onClick={() => setShowPDFPane(false)} style={{ margin: '10px' }}>Close</button>
            </div>
            <div style={{ width: '90%', height: '80%', overflow: 'auto' }}>
              <Document
                file={pdfBlob}
                onLoadSuccess={onDocumentLoadSuccess}
              >
                {Array.from(
                  new Array(numPages),
                  (el, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      width={(window.innerWidth * 0.5 * zoomLevel) - 40}
                    />
                  ),
                )}
              </Document>
            </div>
          </div>
        )}
      </>
    );
  };

  const isDsConfigured = () => {
    return props.useDataSources &&
      props.useDataSources.length === 1 &&
      props.useDataSources[0].fields &&
      props.useDataSources[0].fields.length === 1;
  };

  const getQuery = () => {
    if (!isDsConfigured()) {
      return;
    }
    const fieldName = props.useDataSources[0].fields[0];
    const w = '1=1';
    return {
      where: w,
      outFields: ['*'],
      returnGeometry: true,
      pageSize: 10
    };
  };

  if (!isDsConfigured()) {
    return <h3>This widget demonstrates how to use a feature layer as a data source. Configure the data source.</h3>
  }

  return (
    <div className="widget-use-feature-layer" style={{ width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto' }}>
      <DataSourceComponent useDataSource={props.useDataSources[0]} query={getQuery()} widgetId={props.id} queryCount>
        {dataRender}
      </DataSourceComponent>
    </div>
  );
}




