import { React, DataSourceManager, DataSourceStatus, DataSourceComponent, AllWidgetProps } from 'jimu-core';
import type { IMDataSourceInfo, DataSource, FeatureLayerQueryParams } from 'jimu-core';
import { Document, Page } from 'react-pdf';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { pdfjs } from 'react-pdf';
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import { CSSProperties } from 'react';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import Extent from "@arcgis/core/geometry/Extent.js";
import './widgetStyles.css';

// Set the worker source for pdfjs.
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const { useRef, useState } = React;

const paneStyle: CSSProperties = {
  position: 'absolute',
  top: '20%',
  width: '100%',
  height: '80%',
  backgroundColor: 'white',
  border: '1px solid black'
};

// Set up the virtual file system for pdfMake.
pdfMake.vfs = pdfFonts.pdfMake.vfs;

/**
 * Widget component that displays a PDF report generated from a feature layer.
 * @param {AllWidgetProps<unknown>} props - The widget properties.
 * @returns {JSX.Element} The rendered widget component.
 */
export default function Widget(props: AllWidgetProps<unknown>) {
  const dsRef = useRef(null);
  const mapViewRef = useRef(null);
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
    const mapView = mapViewRef.current;
    console.log("Mapview spatial ref:", mapView.spatialReference); // Logging the map view spatial reference
    const selectedIndex = event.target.value;
    const record = records[selectedIndex];
    console.log("Selected Record:", record); // Logging the selected record
    setSelectedRecord(record);

    // Zoom to the feature's extent
    if (record && record.feature && record.feature.geometry) {
      const featureExtent = record.feature.geometry.extent;
      console.log("Record: ", record); // Logging the record")
      console.log("Feature Extent:", featureExtent); // Logging the feature extent
      const sr = record.feature.geometry.spatialReference
      console.log("Spatial Reference:", sr); // Logging the spatial reference


      // Ensure that the featureExtent is valid before proceeding
      if (featureExtent && featureExtent.xmin !== undefined && featureExtent.ymin !== undefined && featureExtent.xmax !== undefined && featureExtent.ymax !== undefined) {

        mapView.when(() => {
          const extXY = new Extent({
            xmin: featureExtent.xmin,
            ymin: featureExtent.ymin,
            xmax: featureExtent.xmax,
            ymax: featureExtent.ymax,
            spatialReference: sr
          });
          mapView.goTo({ target: extXY.expand(1.33) }, { duration: 2000 });
        });

      } else {
        console.error("Invalid feature extent. Cannot zoom to feature extent.");
      }
    }
    else {
      console.error("Invalid record or geometry. Cannot zoom to feature extent.");
    }
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

  async function handleScreenshot() {
    const mapView = mapViewRef.current;
    const screenshotArea = {
      x: 0,
      y: 0,
      width: mapView.width,
      height: mapView.height
    };
    console.log(mapView.height);

    const screenshot = await mapView.takeScreenshot({ format: 'png', area: screenshotArea, width: mapView.width * 10, height: mapView.height * 10 });

    return screenshot.dataUrl;
  }

  const featureName = selectedRecord?.feature.attributes?.name || "Unknown Name";
  const geometry = selectedRecord?.feature.geometry;

  // 1. Setup the map and layers for the selected feature
  const [webmap] = useState(new WebMap({ basemap: "topo-vector" }));

  console.log("Web Map:", webmap); // Logging the web map

  const [layer] = useState(new FeatureLayer({
    portalItem: {
      id: '306d4e5ec8294275982f3efb5a10916e'
    }
  }));

  console.log("Feature Layer:", layer); // Logging the feature layer

  webmap.add(layer);

  const [mapScreenshotData, setMapScreenshotData] = useState(null);
  React.useEffect(() => {
    if (mapViewRef.current) {
      webmap.add(layer);
      const mapView = new MapView({
        container: mapViewRef.current,
        map: webmap
      });

      mapViewRef.current = mapView;

      // Take a screenshot once the view is ready
      reactiveUtils.whenOnce(() => !mapView.updating).then(async () => {
        try {
          console.log("Map View Zoom Before:", mapView.zoom); // Logging the map view

          mapView.goTo({
            target: mapView.center,
            zoom: mapView.zoom + 5
          });

          // Wait for the mapView to finish updating after the zoom operation
          await new Promise<void>(resolve => {

            const handle = mapView.watch('updating', updating => {
              if (!updating) {
                handle.remove();
                resolve();
              }
            });
          });

          const screenshotDataUrl = await handleScreenshot();
          setMapScreenshotData(screenshotDataUrl);
        } catch (error) {
          console.error("Failed to capture screenshot:", error);
        }
      });

      return () => {
        if (mapView) {
          mapView.destroy();
        }
      };
    }
  }, [webmap, layer]);


  /**
  * Generate a PDF report from the selected feature layer record.
  */
  const generateTestPDF = async () => {

    // Create a canvas for the basemap and polygon
    const canvas = document.createElement('canvas');
    const canvasWidth = 720;
    const canvasHeight = 540;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // Calculate the zoom level based on the bounding box of the selected feature
    const { minX, minY, maxX, maxY } = getBoundingBox(geometry.rings);
    console.log("Bounding Box:", { minX, minY, maxX, maxY }); // Logging the bounding box

    // Convert Web Mercator to geographic coordinates
    const geoMin = webMercatorUtils.xyToLngLat(minX, minY);
    const geoMax = webMercatorUtils.xyToLngLat(maxX, maxY);

    const geoBbox = {
      minX: geoMin[0],
      minY: geoMin[1],
      maxX: geoMax[0],
      maxY: geoMax[1]
    };

    const basemapImgData = canvas.toDataURL('image/png');

    // Draw the selected feature's polygon on a new canvas
    const polygonCanvas = document.createElement('canvas');
    polygonCanvas.width = canvasWidth;
    polygonCanvas.height = canvasHeight;
    const polygonCtx = polygonCanvas.getContext('2d');

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

    // Update the docDefinition to include the basemap image and the polygon image
    const docDefinition = {
      content: [
        slideContent,
        {
          table: {
            widths: ['50%', '50%'],
            heights: [canvasHeight],
            body: [
              ['', {
                image: mapScreenshotData,
                width: canvasWidth / 2,
                height: canvasHeight / 2
              }]
            ]
          },
          layout: 'noBorders'
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

    // Log the spatial reference of the first feature, if available
    if (newRecords.length > 0 && newRecords[0].feature && newRecords[0].feature.geometry) {
      console.log("Feature Layer Spatial Reference WKID:", newRecords[0].feature.geometry.spatialReference.wkid);
      console.log("Feature Layer Spatial Reference WKT:", newRecords[0].feature.geometry.spatialReference.wkt);
    }

    const fName = props.useDataSources && props.useDataSources[0] && props.useDataSources[0].fields ? props.useDataSources[0].fields[0] : null;

    return (
      <>
        <div style={paneStyle} ref={mapViewRef}>
        </div>
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




