import { React, DataSourceComponent, AllWidgetProps } from 'jimu-core';
import type { DataSource } from 'jimu-core';
import { Document, Page } from 'react-pdf';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { pdfjs } from 'react-pdf';
import { CSSProperties } from 'react';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import Extent from "@arcgis/core/geometry/Extent.js";
import Graphic from '@arcgis/core/Graphic';
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Polygon from "@arcgis/core/geometry/Polygon";
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import './widgetStyles.css';

// Set the worker source for pdfjs.
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const { useRef, useState } = React;

let layerView;

const paneStyle: CSSProperties = {
  position: 'absolute',
  top: '20%',
  width: '100%',
  height: '80%',
  backgroundColor: 'white',
  border: '1px solid black',
  //visibility: 'hidden' UPDATE UPDATE ENABLE IN FINAL DEPLOYMENT
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

  const filterPointsWithinPolygon = (polygonGeometry) => {
    // Set a spatial filter on the layer view
    layerView.filter = {
      geometry: polygonGeometry,
      spatialRelationship: "intersects"
    };
  };

  const getPointsInsideFeature = () => {
    // Define query parameters
    const query = layerView.layer.createQuery();
    query.geometry = layerView.filter.geometry; // We use the filter geometry
    query.spatialRelationship = "intersects";

    return layerView.queryFeatures(query)
      .then(result => {
        return result.features.length;
      });
  };


  const createMask = (geometry) => {
    const mapView = mapViewRef.current;

    // Create an instance of the GraphicsLayer
    const maskLayer = new GraphicsLayer();

    mapView.map.add(maskLayer);

    // Create a large polygon that covers the whole map
    const bigPolygon = new Polygon({
      rings: [
        [
          [-20037508.3427892, -20037508.3427892],
          [-20037508.3427892, 20037508.3427892],
          [20037508.3427892, 20037508.3427892],
          [20037508.3427892, -20037508.3427892],
          [-20037508.3427892, -20037508.3427892]
        ]
      ],
      spatialReference: mapView.spatialReference
    });

    // Subtract the feature's geometry from the big polygon to get the mask
    const mask = geometryEngine.difference(bigPolygon, geometry) as Polygon;

    const symbol = new SimpleFillSymbol({
      color: [0, 0, 0, 0],
      outline: {
        color: [0, 0, 0, 0],
        width: 0
      }
    });

    // Create a graphic for the mask
    const maskGraphic = new Graphic({
      geometry: mask,
      symbol: symbol
    });

    // Clear previous mask graphics and add the new mask to the GraphicsLayer
    maskLayer.graphics.removeAll();
    maskLayer.graphics.add(maskGraphic);
  };

  const waitForLayerViewUpdate = () => {
    return new Promise<void>(resolve => {
      if (!layerView.updating) {
        resolve();
      } else {
        const handle = layerView.watch('updating', updating => {
          if (!updating) {
            handle.remove();
            resolve();
          }
        });
      }
    });
  };

  /**
   * Handler for dropdown change event.
   * @param {Event} event - The event object.
   */
  const handleDropdownChange = (event) => {
    const mapView = mapViewRef.current;
    const selectedIndex = event.target.value;
    const record = records[selectedIndex];
    setSelectedRecord(record);

    // Zoom to the feature's extent
    if (record && record.feature && record.feature.geometry) {
      const featureExtent = record.feature.geometry.extent;
      const sr = record.feature.geometry.spatialReference


      // Ensure that the featureExtent is valid before proceeding
      if (featureExtent && featureExtent.xmin !== undefined && featureExtent.ymin !== undefined && featureExtent.xmax !== undefined && featureExtent.ymax !== undefined) {

        mapView.when(() => {

          mapView.graphics.removeAll();

          const extXY = new Extent({
            xmin: featureExtent.xmin,
            ymin: featureExtent.ymin,
            xmax: featureExtent.xmax,
            ymax: featureExtent.ymax,
            spatialReference: sr
          });

          const fillSymbol = new SimpleFillSymbol({
            color: [0, 0, 0, 0],  // This creates a fully transparent fill (RGBA format where A is alpha/opacity)
            style: "solid",  // Note that this is now valid for SimpleFillSymbol
            outline: {
              color: [0, 0, 255], // Blue color for the outline
              width: 2  // Adjust width as needed
            }
          });

          const graphic = new Graphic({
            geometry: record.feature.geometry,
            symbol: fillSymbol
          });

          mapView.graphics.add(graphic);

          mapView.goTo({ target: extXY })
            .then(() => {
              return new Promise<void>(resolve => {
                const handle = mapView.watch('updating', updating => {
                  if (!updating) {
                    handle.remove();
                    resolve();
                  }
                });
              });
            })
            .then(() => createMask(record.feature.geometry))
            .then(() => filterPointsWithinPolygon(record.feature.geometry))
            .then(() => waitForLayerViewUpdate())
            .then(() => getPointsInsideFeature())
            .then(pointsInsideFeature => {
              console.log("Final points inside feature: ", pointsInsideFeature); // Here are the points inside the feature
              return waitForLayerViewUpdate();
            })
            .then(() => handleScreenshot())

            .then(dataUrl => {
              setMapScreenshotData(dataUrl);
            })
            .catch(error => {
              console.error("Error updating map view or capturing screenshot:", error);
            });
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

  async function handleScreenshot() {
    const mapView = mapViewRef.current;
    const screenshotArea = {
      x: 0,
      y: 0,
      width: mapView.width,
      height: mapView.height
    };

    const screenshot = await mapView.takeScreenshot({ format: 'png', area: screenshotArea, width: mapView.width * 10, height: mapView.height * 10 });

    return screenshot.dataUrl;
  }

  const featureName = selectedRecord?.feature.attributes?.name || "Unknown Name";

  // 1. Setup the map and layers for the selected feature
  const [webmap] = useState(new WebMap({ basemap: "topo-vector" }));

  console.log("WebMap Created", webmap);

  const [layer] = useState(new FeatureLayer({
    portalItem: {
      id: '306d4e5ec8294275982f3efb5a10916e'
    }
  }));

  console.log("Layer Created", layer);

  webmap.add(layer);

  console.log("Layer Added", layer);

  console.log("mapView Ref Current", mapViewRef.current)

  const [mapScreenshotData, setMapScreenshotData] = useState(null);
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      if (mapViewRef.current) {
        clearInterval(intervalId); // Stop the interval once mapViewRef.current exists

        webmap.add(layer);
        const mapView = new MapView({
          container: mapViewRef.current,
          map: webmap
        });

        console.log("MapView created");

        mapViewRef.current = mapView;

        mapView.when(() => {
          mapView.whenLayerView(layer).then(lv => {
            layerView = lv;
          });
        });

        console.log("MapView ready");

        // Take a screenshot once the view is ready
        reactiveUtils.whenOnce(() => !mapView.updating).then(async () => {
          try {

            // Wait for the mapView to finish updating after the zoom operation
            await new Promise<void>(resolve => {

              console.log("MapView started updating");

              const handle = mapView.watch('updating', updating => {
                if (!updating) {
                  handle.remove();
                  resolve();
                }
              });
            });

            console.log("MapView finished updating");

            const screenshotDataUrl = await handleScreenshot();
            setMapScreenshotData(screenshotDataUrl);
          } catch (error) {
            console.error("Failed to capture screenshot:", error);
          }
        });
      }
    }, 500); // Check every 500ms

    return () => {
      clearInterval(intervalId); // Cleanup: ensure the interval is cleared when the component unmounts

      if (mapViewRef.current) {
        mapViewRef.current.destroy();
        console.log("MapView destroyed");
      }
    };
  }, [webmap, layer]);



  interface ImageDimensions {
    width: number;
    height: number;
  }

  const getImageDimensions = (base64String: string): Promise<ImageDimensions> => {
    return new Promise((resolve, reject) => {
      const img: HTMLImageElement = new Image();

      img.onload = function (this: HTMLImageElement) {
        resolve({ width: this.width, height: this.height });
      };

      img.onerror = function () {
        reject(new Error("Failed to load image"));
      };

      img.src = base64String;
    });
  };


  const generateTestPDF = async () => {

    let pointsInsideFeature;

    try {
      pointsInsideFeature = await getPointsInsideFeature();
      console.log("Final points inside feature: ", pointsInsideFeature);
    } catch (error) {
      console.error("Error getting points inside feature:", error);
      return; // Exit if there's an error
    }

    // Create a canvas for the basemap and polygon
    const canvas = document.createElement('canvas');
    const canvasWidth = 1920;
    const canvasHeight = 1080;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const dimensions = await getImageDimensions(mapScreenshotData);
    const mapWidth = dimensions.width;
    const mapHeight = dimensions.height;

    console.log("mapWidth:", mapWidth);
    console.log("mapHeight:", mapHeight);

    // Calculate the image's height based on the original width-to-height ratio, considering new width.
    const mapAspectRatio = mapHeight / mapWidth;
    let imageWidth = (canvasWidth / 2) * .8;
    let imageHeight = imageWidth * mapAspectRatio;

    // Ensure the image fits within the canvas height
    if (imageHeight > canvasHeight) {
      const scalingFactor = canvasHeight / imageHeight;
      imageWidth *= scalingFactor;
      imageHeight *= scalingFactor;
    }

    const topMargin = 220;
    const sideMargin = ((canvasWidth / 2) - ((canvasWidth / 2) * .8)) / 2; // You can adjust this value to your liking

    console.log("Image Width:", imageWidth);
    console.log("Image Height:", imageHeight);
    console.log("Top Margin:", topMargin);
    console.log("Side Margin:", sideMargin);

    const selectedFeatureName = featureName;
    const averagePerSquareMile = "#";

    let statistics;

    if (pointsInsideFeature === 1) {
      statistics = [
        { text: "Farmer's Markets", style: 'header', margin: [0, 0, 0, 40] },
        { text: `${pointsInsideFeature} farmer’s market in ${selectedFeatureName}`, style: 'bodyText' },
        { text: "1 farmer’s market for every [#] people", style: 'bodyText' },
        { text: `${averagePerSquareMile} farmer’s markets every square mile`, style: 'bodyText' },
      ];
    } else {
      statistics = [
        { text: "Farmer's Markets", style: 'header', margin: [0, 0, 0, 40] },
        { text: `${pointsInsideFeature} farmer’s markets in ${selectedFeatureName}`, style: 'bodyText' },
        { text: "1 farmer’s market for every [#] people", style: 'bodyText' },
        { text: `${averagePerSquareMile} farmer’s markets every square mile`, style: 'bodyText' },
      ];
    }

    const docDefinition = {
      // Background definition for the red rectangle
      background: function (currentPage, pageSize) {
        if (currentPage === 1) { // Only apply for the first page
          return {
            canvas: [{
              type: 'rect',
              x: pageSize.width - 200,  // Starting from the far right side
              y: 0,
              w: 200,
              h: pageSize.height,
              color: '#990000'
            }]
          };
        }
        return null; // No background for other pages
      },

      content: [
        {
          table: {
            widths: ['50%', '50%'],
            heights: [canvasHeight],
            body: [
              [
                {
                  stack: statistics,
                  alignment: 'center',
                  margin: [0, 320]
                },
                {
                  image: mapScreenshotData,
                  width: imageWidth,
                  height: imageHeight,
                  margin: [sideMargin, topMargin, sideMargin, 0]  // [left, top, right, bottom]
                }
              ]
            ]
          },
          layout: 'noBorders'
        }
      ],

      pageSize: { width: canvasWidth, height: canvasHeight },
      pageOrientation: 'landscape',
      styles: {
        header: {
          fontSize: 96,
          color: 'black'
        },
        bodyText: {
          fontSize: 48,
          color: 'black'
        }
      }
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

  const dataRender = (ds: DataSource) => {
    if (!ds) return null;

    dsRef.current = ds;

    const newRecords = dsRef.current.getRecords();
    if (newRecords.length !== records.length) {
      setRecords(newRecords);
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




