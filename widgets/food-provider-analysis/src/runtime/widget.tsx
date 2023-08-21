import { React, DataSourceManager, DataSourceStatus, DataSourceComponent } from 'jimu-core';
import type { IMDataSourceInfo, DataSource, FeatureLayerQueryParams, AllWidgetProps } from 'jimu-core';
import { Document, Page } from 'react-pdf';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { pdfjs } from 'react-pdf';

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
  const generateTestPDF = () => {
    const featureName = selectedRecord?.feature.attributes?.name || "Unknown Name";
    const geometry = selectedRecord?.feature.geometry;

    // Create canvas and draw polygon
    const canvas = document.createElement('canvas');
    const canvasWidth = 720;
    const canvasHeight = 540;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (geometry && geometry.rings) {
      const { minX, minY, maxX, maxY } = getBoundingBox(geometry.rings);
      const width = maxX - minX;
      const height = maxY - minY;

      // Calculate the scale factor to fit the polygon within the canvas
      const scale = 0.6 * Math.min(canvasWidth / width, canvasHeight / height);

      // Calculate the translation to center the polygon on the canvas
      const translateX = (canvasWidth - width * scale) / 2 - minX * scale;
      const translateY = (canvasHeight - height * scale) / 2 - minY * scale;

      ctx.beginPath();
      geometry.rings[0].forEach((point, index) => {
        const [x, y] = point;
        const canvasX = x * scale + translateX;
        const canvasY = y * scale + translateY;
        if (index === 0) {
          ctx.moveTo(canvasX, canvasY);
        } else {
          ctx.lineTo(canvasX, canvasY);
        }
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,0,0,0.5)';
      ctx.fill();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      console.log("No geometry found for the selected record.");
    }

    const imgData = canvas.toDataURL('image/png');
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
        slideContent,
        slideContent,
        {
          image: imgData,
          width: canvasWidth,
          height: canvasHeight
        }
      ],
      pageSize: { width: canvasWidth, height: canvasHeight },
      pageOrientation: 'landscape'
    };

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
            <button onClick={() => setShowPDFPane(false)} style={{ margin: '10px' }}>Close</button>
            <button onClick={handleDownload} style={{ margin: '10px' }}>Download PDF</button>
            <button onClick={handleZoomIn} style={{ margin: '10px' }}>Zoom In</button>
            <button onClick={handleZoomOut} style={{ margin: '10px' }}>Zoom Out</button>
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




